import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// The session token issued at login belongs to the session it was issued to. It is accepted
// only together with that session's cookie, it ends when that session logs out, a password
// change ends every other token, and it carries a one-day expiry like the session cookie.
// Driven against a real rtl.js with CSRF on (the harness is the one in
// logout-and-password-reset.test.mjs).

const require = createRequire(import.meta.url);
const WebSocket = require('ws');

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PASSWORD = 'password';
const hashOf = (password) => createHash('sha256').update(password).digest('hex');
const ONE_DAY_SECONDS = 24 * 60 * 60;

let configDir;
let child;
let base;
let currentPassword = PASSWORD;

const freePort = () => new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});

const writeConfig = (port) => {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-token-'));
  mkdirSync(join(dir, 'macaroon'));
  writeFileSync(join(dir, 'macaroon', 'admin.macaroon'), 'not-a-real-macaroon');
  mkdirSync(join(dir, 'backup'));
  writeFileSync(join(dir, 'backup', 'channel-all.bak'), '');
  const config = {
    multiPass: PASSWORD,
    port: String(port),
    host: '127.0.0.1',
    defaultNodeIndex: 1,
    dbDirectoryPath: dir,
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' },
    nodes: [{
      index: 1,
      lnNode: 'Node 1',
      lnImplementation: 'LND',
      authentication: { macaroonPath: join(dir, 'macaroon'), configPath: '' },
      settings: {
        userPersona: 'MERCHANT', themeMode: 'DAY', themeColor: 'PURPLE', logLevel: 'ERROR',
        channelBackupPath: join(dir, 'backup'), lnServerUrl: 'https://127.0.0.1:1',
        fiatConversion: false, unannouncedChannels: false, blockExplorerUrl: 'https://mempool.space'
      }
    }]
  };
  writeFileSync(join(dir, 'RTL-Config.json'), JSON.stringify(config, null, 2));
  return dir;
};

const boot = (dir) => new Promise((resolve, reject) => {
  const cleanEnv = { ...process.env };
  ['TRUSTED_PROXIES', 'PORT', 'HOST', 'RTL_SSO', 'RTL_COOKIE_PATH', 'APP_PASSWORD', 'DISABLE_AUTH', 'LN_IMPLEMENTATION', 'LN_SERVER_URL', 'MACAROON_PATH', 'CHANNEL_BACKUP_PATH']
    .forEach((key) => delete cleanEnv[key]);
  const proc = spawn(process.execPath, ['rtl.js'], {
    cwd: repoRoot,
    env: { ...cleanEnv, NODE_ENV: 'production', RTL_CONFIG_PATH: dir, DB_DIRECTORY_PATH: dir }
  });
  let stdout = '';
  let stderr = '';
  const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('rtl.js did not start within 20s. stderr: ' + stderr)); }, 20000);
  proc.stdout.on('data', (chunk) => {
    stdout += chunk;
    if (/Server is up and running/.test(stdout)) { clearTimeout(timer); resolve(proc); }
  });
  proc.stderr.on('data', (chunk) => { stderr += chunk; });
  proc.on('error', (err) => { clearTimeout(timer); reject(err); });
  proc.on('exit', (code) => { clearTimeout(timer); reject(new Error('rtl.js exited with ' + code + ' before listening. stderr: ' + stderr)); });
});

const stop = (proc) => new Promise((resolve) => {
  if (proc.exitCode !== null || proc.signalCode !== null) { resolve(); return; }
  const forceKill = setTimeout(() => proc.kill('SIGKILL'), 5000);
  proc.once('exit', () => { clearTimeout(forceKill); resolve(); });
  proc.kill();
});

const cookieJar = () => {
  const cookies = new Map();
  return {
    absorb: (res) => res.headers.getSetCookie().forEach((line) => {
      const [pair] = line.split(';');
      const [name, value] = pair.split('=');
      cookies.set(name.trim(), value);
    }),
    get: (name) => cookies.get(name),
    header: () => Array.from(cookies, ([name, value]) => name + '=' + value).join('; ')
  };
};

// A browser that has loaded RTL: a session cookie and the CSRF token pair, not logged in.
const newBrowser = async () => {
  const jar = cookieJar();
  jar.absorb(await fetch(base + '/rtl/', { redirect: 'manual' }));
  return jar;
};

const signedIn = async (password = currentPassword) => {
  const jar = await newBrowser();
  const res = await fetch(base + '/rtl/api/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN') || '' },
    body: JSON.stringify({ authenticateWith: 'PASSWORD', authenticationValue: hashOf(password) })
  });
  jar.absorb(res);
  const body = await res.json().catch(() => ({}));
  assert.equal(res.status, 200, 'setup: login');
  return { jar, token: body.token };
};

const post = (path, jar, token, body = {}) => fetch(base + '/rtl/api' + path, {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN') || '', authorization: 'Bearer ' + token },
  body: JSON.stringify(body)
});

// An authenticated call that needs no reachable node: choosing the node for the session.
const selectNode = (jar, token) => post('/conf/updateSelNode/1/-1', jar, token);
const logout = (jar, token) => post('/authenticate/logout', jar, token);

const openSocket = (jar, token) => new Promise((resolve) => {
  const socket = new WebSocket(base.replace(/^http/, 'ws') + '/rtl/api/ws', [token, '1'], { headers: { cookie: jar.header() } });
  socket.once('open', () => resolve({ opened: true, socket }));
  socket.once('unexpected-response', (req, res) => { resolve({ opened: false, status: res.statusCode }); req.destroy(); });
  socket.once('error', () => resolve({ opened: false, status: null }));
});

const closed = (socket, ms = 3000) => new Promise((resolve) => {
  if (socket.readyState === WebSocket.CLOSED) { resolve(true); return; }
  const timer = setTimeout(() => resolve(false), ms);
  socket.once('close', () => { clearTimeout(timer); resolve(true); });
});

before(async () => {
  const port = await freePort();
  configDir = writeConfig(port);
  base = 'http://127.0.0.1:' + port;
  child = await boot(configDir);
});

after(async () => {
  if (child) { await stop(child); }
  if (configDir) { rmSync(configDir, { recursive: true, force: true }); }
});

test('the session token expires after one day', async () => {
  const { token } = await signedIn();
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  assert.equal(typeof payload.exp, 'number', 'the token has no expiry: ' + JSON.stringify(payload));
  assert.equal(payload.exp - payload.iat, ONE_DAY_SECONDS);
});

test('the session token is accepted only with the session it was issued to', async () => {
  const first = await signedIn();
  const second = await signedIn();
  assert.equal((await selectNode(first.jar, first.token)).status, 200, 'setup: the token works with its own session');
  assert.equal((await selectNode(second.jar, first.token)).status, 401, 'the token was accepted with another session');
  assert.equal((await selectNode(await newBrowser(), first.token)).status, 401, 'the token was accepted with a session that never logged in');
});

test('after logout the token is refused, also with a new session', async () => {
  const { jar, token } = await signedIn();
  assert.equal((await logout(jar, token)).status, 200, 'setup: logout');
  assert.equal((await selectNode(await newBrowser(), token)).status, 401, 'the token still selects a node after logout');
});

test('after logout the token no longer opens a websocket', async () => {
  const { jar, token } = await signedIn();
  const before = await openSocket(jar, token);
  assert.equal(before.opened, true, 'setup: the websocket opens with a live token');
  before.socket.close();
  assert.equal((await openSocket(await newBrowser(), token)).opened, false, 'the token opened a websocket with another session');
  assert.equal((await logout(jar, token)).status, 200, 'setup: logout');
  const res = await openSocket(await newBrowser(), token);
  assert.equal(res.opened, false, 'a logged-out token opened a websocket');
  assert.equal(res.status, 401);
});

test("logout closes the session's open websocket", async () => {
  const { jar, token } = await signedIn();
  const { opened, socket } = await openSocket(jar, token);
  assert.equal(opened, true, 'setup: the websocket opens');
  assert.equal((await logout(jar, token)).status, 200, 'setup: logout');
  assert.equal(await closed(socket), true, 'the websocket stayed open after logout');
});

// Runs last: it changes the password for the rest of the file.
test("a password change ends every other token and replaces the caller's", async () => {
  const caller = await signedIn();
  const other = await signedIn();
  const otherSocket = await openSocket(other.jar, other.token);
  assert.equal(otherSocket.opened, true, 'setup: the other session has a websocket');
  const res = await post('/authenticate/reset', caller.jar, caller.token, { currPassword: hashOf(currentPassword), newPassword: hashOf('new-password') });
  assert.equal(res.status, 200, 'setup: reset ' + await res.clone().text());
  currentPassword = 'new-password';
  const { token: newToken } = await res.json();
  assert.equal((await selectNode(other.jar, other.token)).status, 401, "another session's token survived the password change");
  assert.equal((await selectNode(caller.jar, caller.token)).status, 401, "the caller's old token survived the password change");
  assert.equal((await selectNode(caller.jar, newToken)).status, 200, 'the token returned by the reset does not work');
  assert.equal(await closed(otherSocket.socket), true, "another session's websocket stayed open after the password change");
});

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';

// Selecting a node changes what the session works on, so the route is a POST and the CSRF
// check covers it, like every other request that changes state. Driven against a real rtl.js
// with CSRF on and two configured nodes (the harness is the one in
// logout-and-password-reset.test.mjs).

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PASSWORD = 'password';
const passwordHash = createHash('sha256').update(PASSWORD).digest('hex');

let configDir;
let child;
let base;

const freePort = () => new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});

const writeConfig = (port) => {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-node-switch-'));
  // Enough of a config to get past validateNodeConfig without touching a node (same shape as
  // boot-config.test.mjs); the login only needs multiPass, not a reachable LND.
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
    }, {
      index: 2,
      lnNode: 'Node 2',
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

// Starts rtl.js and resolves once it prints the listening line; rejects if it exits first.
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

// SIGTERM, then SIGKILL if it lingers; resolves once the process is gone so the config
// directory (which it rewrites on startup and keeps its db in) can be removed safely.
const stop = (proc) => new Promise((resolve) => {
  if (proc.exitCode !== null || proc.signalCode !== null) { resolve(); return; }
  const forceKill = setTimeout(() => proc.kill('SIGKILL'), 5000);
  proc.once('exit', () => { clearTimeout(forceKill); resolve(); });
  proc.kill();
});

// Undici's fetch does not keep cookies; collect them from set-cookie and send them back.
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

// A page from RTL itself: the CSRF token pair, then a password login.
const signedIn = async () => {
  const jar = cookieJar();
  jar.absorb(await fetch(base + '/rtl/', { redirect: 'manual' }));
  const res = await fetch(base + '/rtl/api/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN') || '' },
    body: JSON.stringify({ authenticateWith: 'PASSWORD', authenticationValue: passwordHash })
  });
  assert.equal(res.status, 200, 'setup: login');
  jar.absorb(res);
  const { token } = await res.json();
  return { jar, token };
};

// The node the session is on, as the settings request every page load makes reports it.
const selectedNodeIndex = async (jar, token) => {
  const res = await fetch(base + '/rtl/api/conf', { headers: { cookie: jar.header(), authorization: 'Bearer ' + token } });
  assert.equal(res.status, 200, 'setup: settings');
  return (await res.json()).selectedNodeIndex;
};

// RTL's own request: the session token, and the CSRF token echoed from the readable cookie.
const selectNode = (jar, token, currIndex, prevIndex) => fetch(base + '/rtl/api/conf/updateSelNode/' + currIndex + '/' + prevIndex, {
  method: 'POST',
  headers: { cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN'), authorization: 'Bearer ' + token, 'content-type': 'application/json' },
  body: '{}'
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

test('a node-switch POST selects the node for the session', async () => {
  const { jar, token } = await signedIn();
  assert.equal(await selectedNodeIndex(jar, token), 1, 'setup: the session starts on node 1');
  const res = await selectNode(jar, token, 2, 1);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).index, 2);
  assert.equal(await selectedNodeIndex(jar, token), 2);
  // Back to node 1, the process-wide default the other tests start from.
  assert.equal((await selectNode(jar, token, 1, 2)).status, 200);
});

test('a GET to the node-switch route selects no node', async () => {
  const { jar, token } = await signedIn();
  const res = await fetch(base + '/rtl/api/conf/updateSelNode/2/1', { headers: { cookie: jar.header(), authorization: 'Bearer ' + token }, redirect: 'manual' });
  const text = await res.text();
  assert.equal(text.includes('"lnNode"'), false, 'the GET answered with a node');
  assert.equal(await selectedNodeIndex(jar, token), 1);
});

test('a node-switch POST without the CSRF token is refused and selects no node', async () => {
  const { jar, token } = await signedIn();
  const res = await fetch(base + '/rtl/api/conf/updateSelNode/2/1', {
    method: 'POST',
    headers: { cookie: jar.header(), authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(res.status, 403);
  assert.equal(await selectedNodeIndex(jar, token), 1);
});

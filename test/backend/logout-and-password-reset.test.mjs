import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';

// Two shared-auth defects, driven against a real rtl.js with CSRF on (the harness is the one
// in csrf-landing-page.test.mjs):
// - Logout was a GET with no check, so a link or top-level navigation from another site ended
//   a logged-in user's session. It is now a POST, which the CSRF check covers.
// - resetPassword stored newPassword as it came. A non-string can never equal the string a
//   login sends, so password login stopped working, and stayed that way after a restart.

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
  const dir = mkdtempSync(join(tmpdir(), 'rtl-auth-'));
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

const login = (jar, headerToken = jar.get('XSRF-TOKEN') || '') => fetch(base + '/rtl/api/authenticate', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    cookie: jar.header(),
    // The Angular XSRF interceptor echoes the readable cookie in this header.
    'x-xsrf-token': headerToken
  },
  body: JSON.stringify({ authenticateWith: 'PASSWORD', authenticationValue: passwordHash })
});


// A page from RTL itself: the CSRF token pair, then a password login.
const signedIn = async (password = PASSWORD) => {
  const jar = cookieJar();
  jar.absorb(await fetch(base + '/rtl/', { redirect: 'manual' }));
  const res = await fetch(base + '/rtl/api/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN') || '' },
    body: JSON.stringify({ authenticateWith: 'PASSWORD', authenticationValue: createHash('sha256').update(password).digest('hex') })
  });
  jar.absorb(res);
  const body = await res.json().catch(() => ({}));
  return { jar, status: res.status, token: body.token };
};

const loggedOut = async (res) => {
  const text = await res.text();
  return res.status === 200 && text.includes('"loggedout":true');
};

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

test('a cross-site GET to logout does not end the session', async () => {
  const { jar, status } = await signedIn();
  assert.equal(status, 200, 'setup: login');
  // What a link or top-level navigation from another site sends: the session cookie only.
  const res = await fetch(base + '/rtl/api/authenticate/logout', { headers: { cookie: jar.header() }, redirect: 'manual' });
  assert.equal(await loggedOut(res), false, 'GET logout still ends the session');
});

test('a logout POST without the CSRF token is refused', async () => {
  const { jar } = await signedIn();
  const res = await fetch(base + '/rtl/api/authenticate/logout', { method: 'POST', headers: { cookie: jar.header() } });
  assert.equal(res.status, 403);
});

test("RTL's own logout, a POST with the CSRF token, ends the session", async () => {
  const { jar, token } = await signedIn();
  const res = await fetch(base + '/rtl/api/authenticate/logout', {
    method: 'POST',
    headers: { cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN'), authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: '{}'
  });
  assert.equal(await loggedOut(res), true, 'status ' + res.status);
});

const reset = (session, newPassword) => fetch(base + '/rtl/api/authenticate/reset', {
  method: 'POST',
  headers: { 'content-type': 'application/json', cookie: session.jar.header(), 'x-xsrf-token': session.jar.get('XSRF-TOKEN'), authorization: 'Bearer ' + session.token },
  body: JSON.stringify({ currPassword: passwordHash, newPassword })
});

for (const bad of [{}, 123, '', null, ['x']]) {
  test(`a password reset to ${JSON.stringify(bad)} is refused and the password still works`, async () => {
    const session = await signedIn();
    assert.equal(session.status, 200, 'setup: login');
    const res = await reset(session, bad);
    assert.equal(res.status, 400, 'reset answered ' + res.status + ' ' + await res.text());
    assert.equal((await signedIn()).status, 200, 'the password no longer logs in');
  });
}

// Runs last: it changes the password for the rest of the file.
test('a password reset to a new hash still works', async () => {
  const session = await signedIn();
  const newHash = createHash('sha256').update('new-password').digest('hex');
  const res = await reset(session, newHash);
  assert.equal(res.status, 200, await res.text());
  assert.equal((await signedIn('new-password')).status, 200, 'the new password does not log in');
  assert.equal((await signedIn()).status, 401, 'the old password still logs in');
});

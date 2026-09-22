import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';

// The frontend reads its CSRF token from the XSRF-TOKEN cookie, which app.ts mints in the
// catch-all that serves index.html for deep links. GET /rtl/ used to be answered by
// express.static instead, above the catch-all, so a visitor entering there got the page
// with no token and a 403 on their first login (issue #1710). CSRF is mounted only outside
// NODE_ENV=development and the static/catch-all order is fixed in the App constructor, so
// this boots rtl.js in a child process and drives it over HTTP the way a browser would.
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
  const dir = mkdtempSync(join(tmpdir(), 'rtl-csrf-'));
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
  const timer = setTimeout(() => { proc.kill(); reject(new Error('rtl.js did not start within 20s. stderr: ' + stderr)); }, 20000);
  proc.stdout.on('data', (chunk) => {
    stdout += chunk;
    if (/Server is up and running/.test(stdout)) { clearTimeout(timer); resolve(proc); }
  });
  proc.stderr.on('data', (chunk) => { stderr += chunk; });
  proc.on('exit', (code) => { clearTimeout(timer); reject(new Error('rtl.js exited with ' + code + ' before listening. stderr: ' + stderr)); });
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

const login = (jar) => fetch(base + '/rtl/api/authenticate', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    cookie: jar.header(),
    // The Angular XSRF interceptor echoes the readable cookie in this header.
    'x-xsrf-token': jar.get('XSRF-TOKEN') || ''
  },
  body: JSON.stringify({ authenticateWith: 'PASSWORD', authenticationValue: passwordHash })
});

before(async () => {
  const port = await freePort();
  configDir = writeConfig(port);
  base = 'http://127.0.0.1:' + port;
  child = await boot(configDir);
});

after(() => {
  if (child) { child.kill(); }
  if (configDir) { rmSync(configDir, { recursive: true, force: true }); }
});

test('GET /rtl/ hands out the CSRF token cookie with the page', async () => {
  const res = await fetch(base + '/rtl/', { redirect: 'manual' });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<rtl-app>/, 'expected index.html');
  const jar = cookieJar();
  jar.absorb(res);
  assert.ok(jar.get('XSRF-TOKEN'), 'no XSRF-TOKEN cookie on GET /rtl/');
  assert.ok(jar.get('_csrf'), 'no _csrf cookie on GET /rtl/');
});

test('a visitor entering at /rtl/ logs in on the first attempt', async () => {
  const jar = cookieJar();
  jar.absorb(await fetch(base + '/rtl/', { redirect: 'manual' }));
  const res = await login(jar);
  assert.equal(res.status, 200, 'first login after GET /rtl/ returned ' + res.status);
});

test('a login with no token is still refused', async () => {
  // Control: the token has to come from the page; the check itself is intact.
  const res = await login(cookieJar());
  assert.equal(res.status, 403);
});

test('/rtl still redirects to /rtl/ and static assets are still served by express.static', async () => {
  const redirect = await fetch(base + '/rtl', { redirect: 'manual' });
  assert.equal(redirect.status, 301);
  assert.equal(new URL(redirect.headers.get('location'), base).pathname, '/rtl/');
  // The 32x32 favicon is in frontend/assets; with index: false only the directory index is
  // left to the catch-all, files are still served (a fall-through would return index.html).
  const asset = await fetch(base + '/rtl/assets/images/favicon-light/favicon-32x32.png');
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('content-type'), 'image/png');
});

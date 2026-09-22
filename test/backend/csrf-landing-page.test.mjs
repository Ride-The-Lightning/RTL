import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { get as rawHttpGet } from 'node:http';
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

// fetch() parses the URL the WHATWG way and strips dot segments (including %2e) before
// the wire, so spellings that only send's decode + normalize collapses to the index
// file have to be sent verbatim, with node:http and an explicit path.
const rawGet = (path) => new Promise((resolve, reject) => {
  const req = rawHttpGet({ hostname: '127.0.0.1', port: base.slice(base.lastIndexOf(':') + 1), path }, (res) => {
    res.resume();
    res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location }));
  });
  req.on('error', reject);
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

test('GET /rtl/ hands out the CSRF token cookie with the page', async () => {
  const res = await fetch(base + '/rtl/', { redirect: 'manual' });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /<rtl-app>/, 'expected index.html');
  const jar = cookieJar();
  jar.absorb(res);
  assert.ok(jar.get('XSRF-TOKEN'), 'no XSRF-TOKEN cookie on GET /rtl/');
  assert.ok(jar.get('_csrf'), 'no _csrf cookie on GET /rtl/');
  // The page carries a per-client token pair, so no shared cache may store it.
  assert.equal(res.headers.get('cache-control'), 'no-store');
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
  // The 403 re-mints the token pair for a retry, so it must not be storable either.
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('a login whose header does not match the signed cookie is still refused', async () => {
  // Control for the double-submit pair: a real _csrf cookie from the page with an
  // attacker-chosen header must not pass, or the check has degraded to token presence.
  const jar = cookieJar();
  jar.absorb(await fetch(base + '/rtl/', { redirect: 'manual' }));
  const res = await login(jar, 'not-the-token-' + jar.get('XSRF-TOKEN'));
  assert.equal(res.status, 403);
});

test('/rtl and /rtl/index.html redirect to /rtl/, and static assets are still served by express.static', async () => {
  const redirect = await fetch(base + '/rtl', { redirect: 'manual' });
  assert.equal(redirect.status, 301);
  assert.equal(new URL(redirect.headers.get('location'), base).pathname, '/rtl/');
  // The index file stays a plain file to express.static under any spelling that send's
  // decode + normalize collapses back to it; each would be served without the token
  // pair, so each is sent to the directory index instead — one entry path.
  for (const spelling of ['/rtl/index.html', '/rtl//index.html', '/rtl///index.html', '/rtl/./index.html',
    '/rtl/%2e/index.html', '/rtl/%69ndex.html', '/rtl/%2f/index.html', '/rtl/index.html/']) {
    const res = await rawGet(spelling);
    assert.equal(res.status, 301, spelling + ' returned ' + res.status);
    assert.equal(new URL(res.location, base).pathname, '/rtl/', spelling);
  }
  // The redirect keeps the query string.
  const withQuery = await rawGet('/rtl/index.html?access-key=x');
  assert.equal(withQuery.status, 301);
  assert.equal(withQuery.location, '/rtl/?access-key=x');
  // The 301 carries a new session's cookie and reflects the query string; a redirect is
  // heuristically cacheable, so it must say no-store.
  const redirectHeaders = await fetch(base + '/rtl/index.html', { redirect: 'manual' });
  assert.equal(redirectHeaders.headers.get('cache-control'), 'no-store');
  // The 32x32 favicon is in frontend/assets; with index: false only the directory index is
  // left to the catch-all, files are still served (a fall-through would return index.html).
  const asset = await fetch(base + '/rtl/assets/images/favicon-light/favicon-32x32.png');
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('content-type'), 'image/png');
});

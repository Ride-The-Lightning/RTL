import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';

// The selected node lives on the server session, which every tab of a browser shares through
// its cookie, while each tab keeps its own copy of the node it shows. Switching node in one
// tab used to leave another tab's /api/cln requests running against the LND node's settings:
// the CLN controller built its URL from LND's lnServerUrl, and LND's REST gateway answered
// "Not Found" to a create-invoice (issue #1742). This boots rtl.js with one node of each kind,
// each pointed at a stub that records what reaches it, and replays the two-tab sequence.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PASSWORD = 'password';
const passwordHash = createHash('sha256').update(PASSWORD).digest('hex');

let configDir;
let child;
let base;
const stubs = {};

const freePort = () => new Promise((resolve, reject) => {
  const probe = createServer();
  probe.on('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const port = probe.address().port;
    probe.close(() => resolve(port));
  });
});

// A stand-in node API: records each request path and answers with the given status and body.
const startStub = (status, body) => new Promise((resolve) => {
  const hits = [];
  const server = createHttpServer((req, res) => {
    hits.push(req.method + ' ' + req.url);
    req.resume();
    req.on('end', () => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    });
  });
  server.listen(0, '127.0.0.1', () => resolve({ server, hits, url: 'http://127.0.0.1:' + server.address().port }));
});

const writeConfig = (port) => {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-node-guard-'));
  mkdirSync(join(dir, 'macaroon'));
  writeFileSync(join(dir, 'macaroon', 'admin.macaroon'), 'not-a-real-macaroon');
  writeFileSync(join(dir, 'rune'), 'LIGHTNING_RUNE="not-a-real-rune"\n');
  mkdirSync(join(dir, 'backup-1'));
  mkdirSync(join(dir, 'backup-2'));
  writeFileSync(join(dir, 'backup-2', 'channel-all.bak'), '');
  const settings = {
    userPersona: 'OPERATOR', themeMode: 'DAY', themeColor: 'PURPLE', logLevel: 'ERROR',
    fiatConversion: false, unannouncedChannels: false, blockExplorerUrl: 'https://mempool.space'
  };
  const config = {
    multiPass: PASSWORD,
    port: String(port),
    host: '127.0.0.1',
    defaultNodeIndex: 1,
    dbDirectoryPath: dir,
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' },
    nodes: [{
      index: 1,
      lnNode: 'Core Lightning',
      lnImplementation: 'CLT',
      authentication: { runePath: join(dir, 'rune') },
      settings: { ...settings, lnServerUrl: stubs.cln.url, channelBackupPath: join(dir, 'backup-1') }
    }, {
      index: 2,
      lnNode: 'LND',
      lnImplementation: 'LND',
      authentication: { macaroonPath: join(dir, 'macaroon'), configPath: '' },
      settings: { ...settings, lnServerUrl: stubs.lnd.url, channelBackupPath: join(dir, 'backup-2') }
    }]
  };
  writeFileSync(join(dir, 'RTL-Config.json'), JSON.stringify(config, null, 2));
  return dir;
};

// Starts rtl.js and resolves once it prints the listening line; rejects if it exits first.
const boot = (dir) => new Promise((resolve, reject) => {
  const cleanEnv = { ...process.env };
  ['TRUSTED_PROXIES', 'PORT', 'HOST', 'RTL_SSO', 'RTL_COOKIE_PATH', 'APP_PASSWORD', 'DISABLE_AUTH', 'LN_IMPLEMENTATION', 'LN_SERVER_URL',
    'LND_SERVER_URL', 'MACAROON_PATH', 'RUNE_PATH', 'CHANNEL_BACKUP_PATH']
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

// A logged-in browser: one session cookie, shared by every tab, and the session token.
const openBrowser = async () => {
  const jar = cookieJar();
  jar.absorb(await fetch(base + '/rtl/', { redirect: 'manual' }));
  const res = await fetch(base + '/rtl/api/authenticate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN') },
    body: JSON.stringify({ authenticateWith: 'PASSWORD', authenticationValue: passwordHash })
  });
  assert.equal(res.status, 200, 'login returned ' + res.status);
  jar.absorb(res);
  const { token } = await res.json();
  const call = async (method, path, body, withToken = true) => {
    const headers = { cookie: jar.header(), 'x-xsrf-token': jar.get('XSRF-TOKEN') };
    if (withToken) { headers.authorization = 'Bearer ' + token; }
    if (body) { headers['content-type'] = 'application/json'; }
    const callRes = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    jar.absorb(callRes);
    return callRes;
  };
  return { call };
};

// What a tab does on a node switch: select the node on the session, then fetch its info,
// which is also where the server sets up the node's request options.
const IMPLEMENTATION_PATH = { 1: 'cln', 2: 'lnd' };
const switchNode = async (browser, currIndex, prevIndex) => {
  const res = await browser.call('GET', '/rtl/api/conf/updateSelNode/' + currIndex + '/' + prevIndex);
  assert.equal(res.status, 200, 'updateSelNode returned ' + res.status);
  await browser.call('GET', '/rtl/api/' + IMPLEMENTATION_PATH[currIndex] + '/getinfo');
  stubs.cln.hits.length = 0;
  stubs.lnd.hits.length = 0;
};

const createInvoice = (browser, withToken) => browser.call('POST', '/rtl/api/cln/invoices', { amount_msat: 40000000, label: 'l', description: '40k-rebalance' }, withToken);

before(async () => {
  stubs.cln = await startStub(201, { payment_hash: 'ab', bolt11: 'lnbc1' });
  stubs.lnd = await startStub(404, { code: 5, message: 'Not Found', details: [] });
  const port = await freePort();
  configDir = writeConfig(port);
  base = 'http://127.0.0.1:' + port;
  child = await boot(configDir);
});

after(async () => {
  if (child) { await stop(child); }
  if (configDir) { rmSync(configDir, { recursive: true, force: true }); }
  Object.values(stubs).forEach((stub) => { stub.server.closeAllConnections(); stub.server.close(); });
});

test('a CLN request reaches the CLN node while the session is on it', async () => {
  // Control: the guard must not get in the way of the ordinary case.
  const browser = await openBrowser();
  await switchNode(browser, 1, -1);
  const res = await createInvoice(browser, true);
  assert.equal(res.status, 201);
  assert.deepEqual(stubs.cln.hits, ['POST /v1/invoice']);
});

test('a CLN request from a tab left behind after another tab switched to LND is refused, not sent to LND', async () => {
  const browser = await openBrowser();
  await switchNode(browser, 1, -1); // tab A shows Core Lightning
  await switchNode(browser, 2, 1); // tab B, same cookie, switches to LND
  const res = await createInvoice(browser, true); // tab A creates an invoice
  assert.equal(res.status, 409, 'expected 409, got ' + res.status);
  const body = await res.json();
  assert.match(body.error, /LND/);
  assert.deepEqual(stubs.lnd.hits, [], 'the CLN request was sent to the LND node');
  assert.deepEqual(stubs.cln.hits, []);
});

test('an LND request while the session is on CLN is refused the same way', async () => {
  const browser = await openBrowser();
  await switchNode(browser, 1, -1);
  const res = await browser.call('GET', '/rtl/api/lnd/balance/blockchain');
  assert.equal(res.status, 409, 'expected 409, got ' + res.status);
  assert.deepEqual(stubs.lnd.hits, []);
  assert.deepEqual(stubs.cln.hits, []);
});

test('a mismatched request without a session token still gets 401, not 409', async () => {
  // The implementation check must not answer before authentication: an unauthenticated
  // caller learns nothing about which node is selected.
  const browser = await openBrowser();
  await switchNode(browser, 2, -1);
  const res = await createInvoice(browser, false);
  assert.equal(res.status, 401);
});

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';

import express from 'express';

import sharedRoutes from '../../backend/routes/shared/index.js';

// The Boltz integration was removed in 0.15.13 (#1724). A config or environment that still
// carries its settings must keep booting, and says once on the console that they are ignored.
// The notice comes from code that runs while rtl.js starts, so it is read the way an operator
// meets it: from the output of rtl.js started against a throwaway RTL-Config.json.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const NOTICE = /Boltz support was removed in RTL v0\.15\.13/g;
const tempDirs = [];
after(() => tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const writeConfig = ({ settings = {}, authentication = {}, nodeCount = 1 } = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-boltz-'));
  tempDirs.push(dir);
  // Enough of a config to get past validateNodeConfig without touching a node: a macaroon
  // file to read, and an existing channel-all.bak so no backup request is attempted.
  mkdirSync(join(dir, 'macaroon'));
  writeFileSync(join(dir, 'macaroon', 'admin.macaroon'), 'not-a-real-macaroon');
  mkdirSync(join(dir, 'backup'));
  writeFileSync(join(dir, 'backup', 'channel-all.bak'), '');
  const config = {
    multiPass: 'password',
    port: '0',
    defaultNodeIndex: 1,
    dbDirectoryPath: dir,
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' },
    nodes: Array.from({ length: nodeCount }, (_, i) => ({
      index: i + 1,
      lnNode: 'Node ' + (i + 1),
      lnImplementation: 'LND',
      authentication: { macaroonPath: join(dir, 'macaroon'), configPath: '', ...authentication },
      settings: {
        userPersona: 'MERCHANT', themeMode: 'DAY', themeColor: 'PURPLE', logLevel: 'ERROR',
        channelBackupPath: join(dir, 'backup'), lnServerUrl: 'https://127.0.0.1:1',
        fiatConversion: false, unannouncedChannels: false, blockExplorerUrl: 'https://mempool.space', ...settings
      }
    }))
  };
  writeFileSync(join(dir, 'RTL-Config.json'), JSON.stringify(config, null, 2));
  return dir;
};

// Starts rtl.js and resolves once it exits or prints the listening line (then it is killed).
const boot = (configDir, env = {}) => new Promise((resolve) => {
  // The developer's own RTL variables must not reach the child: config.ts honours them.
  const cleanEnv = { ...process.env };
  ['BOLTZ_SERVER_URL', 'BOLTZ_MACAROON_PATH', 'TRUSTED_PROXIES', 'PORT', 'HOST', 'RTL_SSO', 'RTL_COOKIE_PATH', 'APP_PASSWORD', 'DISABLE_AUTH', 'LN_IMPLEMENTATION', 'LN_SERVER_URL', 'MACAROON_PATH', 'CHANNEL_BACKUP_PATH']
    .forEach((key) => delete cleanEnv[key]);
  const child = spawn(process.execPath, ['rtl.js'], {
    cwd: repoRoot,
    env: { ...cleanEnv, RTL_CONFIG_PATH: configDir, DB_DIRECTORY_PATH: configDir, ...env }
  });
  let stdout = '';
  let stderr = '';
  let settled = false;
  const finish = (code) => {
    if (settled) { return; }
    settled = true;
    clearTimeout(timer);
    resolve({ code, stdout, stderr, notices: (stdout.match(NOTICE) || []).length });
  };
  const timer = setTimeout(() => { child.kill(); finish('timeout'); }, 20000);
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    if (/Server is up and running/.test(stdout)) { child.kill(); finish('listening'); }
  });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('exit', (code) => finish(code));
});

const CASES = [
  ['a node with boltzServerUrl', { settings: { boltzServerUrl: 'https://127.0.0.1:9003' } }, {}],
  ['a node with only boltzMacaroonPath', { authentication: { boltzMacaroonPath: '/boltz' } }, {}],
  ['BOLTZ_SERVER_URL in the environment', {}, { BOLTZ_SERVER_URL: 'https://127.0.0.1:9003', BOLTZ_MACAROON_PATH: '/boltz' }],
  ['two nodes that both carry Boltz settings', { settings: { boltzServerUrl: 'https://127.0.0.1:9003' }, nodeCount: 2 }, {}]
];

for (const [name, config, env] of CASES) {
  test(`${name}: RTL still boots and says once that Boltz settings are ignored`, async () => {
    const result = await boot(writeConfig(config), env);
    assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
    assert.equal(result.notices, 1, result.stdout);
  });
}

test('no Boltz settings: no notice', async () => {
  for (const config of [{}, { settings: { boltzServerUrl: '' }, authentication: { boltzMacaroonPath: '  ' } }]) {
    const result = await boot(writeConfig(config));
    assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
    assert.equal(result.notices, 0, result.stdout);
  }
});

test('the Boltz API routes are gone', async () => {
  const app = express();
  app.use((req, res, next) => { req.session = {}; next(); });
  app.use('/api', sharedRoutes);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    for (const [method, path] of [['GET', '/info'], ['GET', '/serviceInfo'], ['GET', '/listSwaps'], ['GET', '/swapInfo/abc'], ['POST', '/createSwap'], ['POST', '/createReverseSwap'], ['POST', '/createChannel'], ['POST', '/deposit']]) {
      const res = await fetch(base + '/api/boltz' + path, { method });
      assert.equal(res.status, 404, `${method} /api/boltz${path} answered ${res.status}`);
    }
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

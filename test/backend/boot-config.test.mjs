import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';

// Boot-time refusals for a bad trustedProxies value (issue #1656). Both branches sit in code
// that runs as a side effect of importing the config and app modules, so they are exercised
// the way an operator meets them: by starting rtl.js in a child process against a throwaway
// RTL-Config.json and reading what it prints before it exits.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tempDirs = [];
after(() => tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const writeConfig = (trustedProxies) => {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-boot-'));
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
  if (trustedProxies !== undefined) { config.trustedProxies = trustedProxies; }
  writeFileSync(join(dir, 'RTL-Config.json'), JSON.stringify(config, null, 2));
  return dir;
};

// Starts rtl.js and resolves once it exits or prints the listening line (then it is killed).
const boot = (configDir, env = {}) => new Promise((resolve) => {
  // The developer's own RTL variables must not reach the child: config.ts honours them,
  // and an exported TRUSTED_PROXIES or PORT would change what is being tested.
  const cleanEnv = { ...process.env };
  ['TRUSTED_PROXIES', 'PORT', 'HOST', 'RTL_SSO', 'RTL_COOKIE_PATH', 'APP_PASSWORD', 'DISABLE_AUTH', 'LN_IMPLEMENTATION', 'LN_SERVER_URL', 'MACAROON_PATH', 'CHANNEL_BACKUP_PATH']
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
    resolve({ code, stdout, stderr });
  };
  const timer = setTimeout(() => { child.kill(); finish('timeout'); }, 20000);
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    if (/Server is up and running/.test(stdout)) { child.kill(); finish('listening'); }
  });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('exit', (code) => finish(code));
});

test('a non-string trustedProxies refuses to start with a message naming the key', async () => {
  const result = await boot(writeConfig(123));
  // Exactly 1: 'timeout' (printed the message, then hung) must not pass either.
  assert.equal(result.code, 1, 'stderr: ' + result.stderr);
  assert.match(result.stderr, /trustedProxies must be a comma-separated list/);
});

test('a malformed trustedProxies list refuses to start when express compiles it', async () => {
  const result = await boot(writeConfig('garbage, loopback'));
  assert.equal(result.code, 1, 'stderr: ' + result.stderr);
  assert.match(result.stderr, /Invalid trustedProxies value "garbage, loopback": invalid IP address: garbage/);
});

test('an empty TRUSTED_PROXIES switches off the config file list rather than falling through to it', async () => {
  // The file's list is malformed, so if the empty variable fell through to it the boot would
  // refuse; reaching the listening line proves the variable took precedence.
  const result = await boot(writeConfig('garbage, loopback'), { TRUSTED_PROXIES: '' });
  assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
});

test('a well-formed trustedProxies list boots (control for the refusals above)', async () => {
  const result = await boot(writeConfig('127.0.0.1, 10.0.0.0/8'));
  assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
});

// Issue #731: rtl.js must log the address it really bound, not the one the config implies.
test('with no host the startup line says RTL is listening on all network interfaces', async () => {
  const result = await boot(writeConfig());
  assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
  assert.match(result.stdout, /running on all network interfaces \((::|0\.0\.0\.0), port \d+\)/);
  assert.match(result.stdout, /No host is set, so RTL accepts connections from other machines/);
});

test('with HOST set to 127.0.0.1 the startup line names that address and carries no notice', async () => {
  const result = await boot(writeConfig(), { HOST: '127.0.0.1' });
  assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
  assert.match(result.stdout, /running on 127\.0\.0\.1:\d+, please open the UI at http:\/\/127\.0\.0\.1:\d+/);
  assert.doesNotMatch(result.stdout, /No host is set/);
});

test('a port already in use is not reported as localhost when no host is set', async () => {
  const blocker = createServer();
  await new Promise((resolve) => blocker.listen(0, resolve));
  const { port } = blocker.address();
  let result;
  try { result = await boot(writeConfig(), { PORT: String(port) }); } finally { blocker.close(); }
  assert.equal(result.code, 1, 'stderr: ' + result.stderr);
  assert.ok(result.stderr.includes('Port ' + port + ' is already in use'), 'stderr: ' + result.stderr);
  assert.doesNotMatch(result.stderr, /localhost/);
});

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';

// updateConfig renames the pre-0.15.1 node keys `Authentication` and `Settings` to lowercase.
// It used to write RTL-Config.json back on every start, renamed or not (#1813): a needless,
// non-atomic rewrite that reformatted a hand-edited file and changed its modification time.
// The file is now written only when a key was actually renamed. Like boot-config.test.mjs,
// this runs rtl.js in a child process against a throwaway config, because the code under test
// runs as a side effect of importing the config module.
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tempDirs = [];
after(() => tempDirs.forEach((dir) => {
  // A test below makes its config read-only; undo that so the directory can be removed.
  try { chmodSync(join(dir, 'RTL-Config.json'), 0o644); } catch (err) { /* already gone */ }
  rmSync(dir, { recursive: true, force: true });
}));

// A fixed time in the past, so that a rewrite shows up as a changed mtime whatever the
// filesystem's timestamp resolution.
const PAST = new Date('2020-01-01T00:00:00Z');

// Writes a config and returns its path. `keys` names the two per-node blocks, and `serialise`
// decides the file's formatting.
const writeConfig = ({ keys = ['authentication', 'settings'], serialise = (config) => JSON.stringify(config, null, 2) } = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'rtl-rewrite-'));
  tempDirs.push(dir);
  // Enough of a config to get past validateNodeConfig without touching a node: a macaroon
  // file to read, and an existing channel-all.bak so no backup request is attempted.
  mkdirSync(join(dir, 'macaroon'));
  writeFileSync(join(dir, 'macaroon', 'admin.macaroon'), 'not-a-real-macaroon');
  mkdirSync(join(dir, 'backup'));
  writeFileSync(join(dir, 'backup', 'channel-all.bak'), '');
  const config = {
    // Already hashed: a plaintext multiPass is replaced by its hash on first start, which is a
    // rewrite of its own (replacePasswordWithHash) and not the one under test.
    multiPassHashed: createHash('sha256').update('password').digest('hex'),
    port: '0',
    defaultNodeIndex: 1,
    dbDirectoryPath: dir,
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' },
    nodes: [{
      index: 1,
      lnNode: 'Node 1',
      lnImplementation: 'LND',
      [keys[0]]: { macaroonPath: join(dir, 'macaroon'), configPath: '' },
      [keys[1]]: {
        userPersona: 'MERCHANT', themeMode: 'DAY', themeColor: 'PURPLE', logLevel: 'ERROR',
        channelBackupPath: join(dir, 'backup'), lnServerUrl: 'https://127.0.0.1:1',
        fiatConversion: false, unannouncedChannels: false, blockExplorerUrl: 'https://mempool.space'
      }
    }]
  };
  const file = join(dir, 'RTL-Config.json');
  writeFileSync(file, serialise(config));
  utimesSync(file, PAST, PAST);
  return file;
};

// Starts rtl.js and resolves once it has exited: by itself, or killed after printing the
// listening line or after the timeout. Waiting for the exit matters because the child keeps
// its logs and database in the config directory, which is removed when the tests finish.
const boot = (configFile) => new Promise((resolve) => {
  const configDir = dirname(configFile);
  // The developer's own RTL variables must not reach the child: config.ts honours them.
  const cleanEnv = { ...process.env };
  ['TRUSTED_PROXIES', 'PORT', 'HOST', 'RTL_SSO', 'RTL_COOKIE_PATH', 'APP_PASSWORD', 'DISABLE_AUTH', 'LN_IMPLEMENTATION', 'LN_SERVER_URL', 'MACAROON_PATH', 'CHANNEL_BACKUP_PATH']
    .forEach((key) => delete cleanEnv[key]);
  const child = spawn(process.execPath, ['rtl.js'], {
    cwd: repoRoot,
    env: { ...cleanEnv, RTL_CONFIG_PATH: configDir, DB_DIRECTORY_PATH: configDir }
  });
  let stdout = '';
  let stderr = '';
  // Set when this helper kills the child, and reported in place of its exit code.
  let outcome = null;
  let settled = false;
  const finish = (code) => {
    if (settled) { return; }
    settled = true;
    clearTimeout(timer);
    resolve({ code, stdout, stderr });
  };
  const stop = (reason) => {
    if (outcome === null) { outcome = reason; child.kill(); }
  };
  const timer = setTimeout(() => stop('timeout'), 20000);
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
    if (/Server is up and running/.test(stdout)) { stop('listening'); }
  });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('exit', (code) => finish(outcome === null ? code : outcome));
  // A child that could not be spawned emits 'error' and never 'exit'.
  child.on('error', (err) => { stderr += String(err); finish('spawn-error'); });
});

test('a config with no legacy keys is left untouched on start', async () => {
  // Tabs and a trailing blank line: formatting RTL would not produce, as in a hand-edited file.
  const file = writeConfig({ serialise: (config) => JSON.stringify(config, null, '\t') + '\n\n' });
  const before = readFileSync(file);
  const result = await boot(file);
  assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
  assert.ok(readFileSync(file).equals(before), 'the config file was rewritten');
  assert.equal(statSync(file).mtimeMs, PAST.getTime(), 'the config file was written to');
});

test('legacy Authentication and Settings keys are still migrated to lowercase on disk', async () => {
  const file = writeConfig({ keys: ['Authentication', 'Settings'] });
  const result = await boot(file);
  assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
  const node = JSON.parse(readFileSync(file, 'utf-8')).nodes[0];
  assert.deepEqual(Object.keys(node), ['index', 'lnNode', 'lnImplementation', 'authentication', 'settings']);
  assert.equal(node.settings.lnServerUrl, 'https://127.0.0.1:1');
  assert.match(node.authentication.macaroonPath, /macaroon$/);
  assert.notEqual(statSync(file).mtimeMs, PAST.getTime());
});

// Root ignores file permissions, so there is nothing to observe when the suite runs as root.
test('a read-only config with no legacy keys no longer stops RTL from starting', { skip: process.getuid?.() === 0 }, async () => {
  const file = writeConfig();
  chmodSync(file, 0o444);
  const result = await boot(file);
  assert.equal(result.code, 'listening', 'stderr: ' + result.stderr);
});

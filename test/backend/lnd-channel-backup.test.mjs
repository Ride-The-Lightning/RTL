import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, parse } from 'node:path';
import test from 'node:test';

import { getBackup, postBackupVerify, postRestore } from '../../backend/controllers/lnd/channelsBackup.js';

// The backup, verify and restore handlers name their files after req.params.channelPoint. An
// unchecked value (Express has already decoded %2F to /) pointed the path outside the backup
// directory, and a failed backup write was an unhandled stream error that stopped the process.

const TXID = 'ab'.repeat(32);
const CHANNEL_POINT = `${TXID}:1`;
const BACKUP = { chan_point: { funding_txid_str: TXID, output_index: 1 }, chan_backup: 'c29tZS1ieXRlcw==' };

const startFakeLnd = async () => {
  const seen = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      seen.push({ method: req.method, path: req.url, body });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.method === 'GET' ? BACKUP : {}));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (url, channelBackupPath, channelPoint) => ({
  session: {
    selectedNode: {
      index: 1, lnNode: 'test-node', lnImplementation: 'LND', lnVersion: '0.18.0',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': 'mac' } } },
      settings: { lnServerUrl: url, channelBackupPath, logLevel: 'ERROR' }
    }
  },
  params: { channelPoint }
});

const run = (handler, req) => new Promise((resolve) => {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; resolve(res); return res; };
  handler(req, res, null);
});

// Every file under dir, relative to it, so a test can see anything written or left behind.
const tree = (dir) => readdirSync(dir, { recursive: true }).sort();

const backupDir = () => {
  const root = mkdtempSync(join(tmpdir(), 'rtl-backup-'));
  const dir = join(root, 'node-1');
  mkdirSync(join(dir, 'restore'), { recursive: true });
  return { root, dir };
};

const MALFORMED = ['a/b', '../x', `${TXID}:1/../../x`, `x/../../../${TXID}:1`, TXID, `${TXID}:`, 'all', ''];

test('backup, verify and restore refuse a channel point that is not ALL or a txid:index outpoint', async () => {
  const lnd = await startFakeLnd();
  const { root, dir } = backupDir();
  // A file the traversal ids would reach if they got into the path.
  writeFileSync(join(root, 'x.bak'), JSON.stringify(BACKUP));
  const before = tree(root);
  try {
    for (const handler of [getBackup, postBackupVerify, postRestore]) {
      for (const id of MALFORMED) {
        const res = await run(handler, buildRequest(lnd.url, dir, id));
        assert.equal(res.statusCode, 400, `${handler.name} accepted ${JSON.stringify(id)}`);
      }
    }
    assert.deepEqual(lnd.seen, []);
    assert.deepEqual(tree(root), before);
  } finally { await lnd.close(); }
});

test('backup writes the channel\'s file inside the backup directory, and verify and restore read it back', async () => {
  const lnd = await startFakeLnd();
  const { dir } = backupDir();
  const file = `channel-${TXID}-1.bak`;
  try {
    const backup = await run(getBackup, buildRequest(lnd.url, dir, CHANNEL_POINT));
    assert.equal(backup.statusCode, 200);
    assert.deepEqual(JSON.parse(readFileSync(join(dir, file), 'utf-8')), BACKUP);

    const verify = await run(postBackupVerify, buildRequest(lnd.url, dir, CHANNEL_POINT));
    assert.equal(verify.statusCode, 201);

    writeFileSync(join(dir, 'restore', file), JSON.stringify(BACKUP));
    const restore = await run(postRestore, buildRequest(lnd.url, dir, CHANNEL_POINT));
    assert.equal(restore.statusCode, 201);
    assert.ok(existsSync(join(dir, 'restore', file + '.restored')));

    assert.deepEqual(lnd.seen.map((r) => `${r.method} ${r.path}`), [
      `GET /v1/channels/backup/${TXID}/1`, 'POST /v1/channels/backup/verify', 'POST /v1/channels/backup/restore'
    ]);
    assert.deepEqual(JSON.parse(lnd.seen[1].body), { single_chan_backups: { chan_backups: [BACKUP] } });
  } finally { await lnd.close(); }
});

test('backup of ALL still writes channel-all.bak', async () => {
  const lnd = await startFakeLnd();
  const { dir } = backupDir();
  try {
    const res = await run(getBackup, buildRequest(lnd.url, dir, 'ALL'));
    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/channels/backup');
    assert.deepEqual(JSON.parse(readFileSync(join(dir, 'channel-all.bak'), 'utf-8')), BACKUP);
  } finally { await lnd.close(); }
});

test('a backup directory that does not exist answers an error instead of stopping the process', async () => {
  const lnd = await startFakeLnd();
  const { root } = backupDir();
  const missing = join(root, 'not-created');
  try {
    const res = await run(getBackup, buildRequest(lnd.url, missing, CHANNEL_POINT));
    assert.equal(res.statusCode, 500);
    // Give a stray stream 'error' a chance to surface before the test ends.
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(existsSync(missing), false);
  } finally { await lnd.close(); }
});

test('a backup directory at the filesystem root is not mistaken for a path outside it', async () => {
  const lnd = await startFakeLnd();
  try {
    // resolve() keeps the trailing separator for a root, so the containment prefix must not add a second one.
    const res = await run(postBackupVerify, buildRequest(lnd.url, parse(tmpdir()).root, CHANNEL_POINT));
    assert.equal(res.statusCode, 404, JSON.stringify(res.body));
    assert.deepEqual(lnd.seen, []);
  } finally { await lnd.close(); }
});

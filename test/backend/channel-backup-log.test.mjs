import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { getBackup } from '../../backend/controllers/lnd/channelsBackup.js';
import { Common } from '../../backend/utils/common.js';

// At logLevel DEBUG, taking a channel backup wrote the whole backup into the node's log as
// well as into the backup file. The log now names the node or file only.

const MARKER = 'YmFja3VwLWJ5dGVzLWZvci1sb2ctdGVzdA==';
const TXID = 'ab'.repeat(32);
const BACKUPS = {
  all: { single_chan_backups: { chan_backups: [] }, multi_chan_backup: { chan_points: [], multi_chan_backup: MARKER } },
  one: { chan_point: { funding_txid_str: TXID, output_index: 1 }, chan_backup: MARKER }
};

const startFakeLnd = () => {
  const server = createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(req.url === '/v1/channels/backup' ? BACKUPS.all : BACKUPS.one));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done))
  })));
};

const readLog = async (file, marker) => {
  for (let i = 0; i < 100; i++) {
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (text.includes(marker)) { return text; }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail('log never contained ' + marker);
};

const makeNode = (url) => {
  const root = mkdtempSync(join(tmpdir(), 'rtl-backup-log-'));
  const channelBackupPath = join(root, 'backup');
  const macaroonPath = join(root, 'macaroon');
  mkdirSync(channelBackupPath, { recursive: true });
  mkdirSync(macaroonPath, { recursive: true });
  writeFileSync(join(macaroonPath, 'admin.macaroon'), 'mac');
  return {
    index: 1, lnNode: 'lnd-node', lnImplementation: 'LND', lnVersion: '0.18.0',
    authentication: { macaroonPath, options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': 'mac' } } },
    settings: { lnServerUrl: url, channelBackupPath, logLevel: 'DEBUG', logFile: join(root, 'node.log') }
  };
};

for (const channelPoint of ['ALL', `${TXID}:1`]) {
  test(`backing up ${channelPoint === 'ALL' ? 'all channels' : 'one channel'} saves the backup and leaves it out of the log`, async () => {
    const lnd = await startFakeLnd();
    const node = makeNode(lnd.url);
    try {
      const res = await new Promise((resolve) => {
        const out = { statusCode: null };
        out.status = (code) => { out.statusCode = code; return out; };
        out.json = (payload) => { out.body = payload; resolve(out); return out; };
        getBackup({ session: { selectedNode: node }, params: { channelPoint } }, out, null);
      });
      assert.equal(res.statusCode, 200);
      const file = join(node.settings.channelBackupPath, channelPoint === 'ALL' ? 'channel-all.bak' : `channel-${TXID}-1.bak`);
      assert.ok(readFileSync(file, 'utf8').includes(MARKER), 'backup file holds the backup');
      const log = await readLog(node.settings.logFile, 'Channel Backed up and Saved');
      assert.ok(!log.includes(MARKER), 'backup written to the log');
    } finally { await lnd.close(); }
  });
}

test('the backup refreshed on getinfo is saved and left out of the log', async () => {
  const lnd = await startFakeLnd();
  const node = makeNode(lnd.url);
  const savedSelected = Common.selectedNode;
  Common.selectedNode = node;
  try {
    Common.getAllNodeAllChannelBackup(node);
    const log = await readLog(node.settings.logFile, 'Successful in Channel Backup');
    assert.ok(readFileSync(join(node.settings.channelBackupPath, 'channel-all.bak'), 'utf8').includes(MARKER), 'backup file holds the backup');
    assert.ok(!log.includes(MARKER), 'backup written to the log');
  } finally {
    Common.selectedNode = savedSelected;
    await lnd.close();
  }
});

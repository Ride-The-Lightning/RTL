import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after, afterEach } from 'node:test';

import { getInfo } from '../../backend/controllers/lnd/getInfo.js';
import { Common } from '../../backend/utils/common.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// Every LND getinfo refreshes channel-all.bak for every configured LND node, not only the
// selected one. A node whose admin.macaroon could not be read threw out of that loop and failed
// getinfo for the healthy node the caller had selected, and a node whose backup call failed had
// its stored channel-all.bak overwritten with an empty file.

// Importing the controller loads the websocket server, whose ping timer would otherwise keep
// the test process alive after the last test.
after(() => clearInterval(WSServer.pingInterval));

const savedNodes = Common.nodes;
afterEach(() => { Common.nodes = savedNodes; });

const BACKUP = { single_chan_backups: { chan_backups: [] }, multi_chan_backup: { chan_points: [], multi_chan_backup: 'bmV3LWJhY2t1cA==' } };
const OLD_BACKUP = JSON.stringify({ multi_chan_backup: { chan_points: [], multi_chan_backup: 'b2xkLWJhY2t1cA==' } });

// backup: 'ok' answers the snapshot, 'fail' answers 500, 'empty' answers 200 with no body.
const startFakeLnd = async (backup = 'ok') => {
  const seen = [];
  const server = createServer((req, res) => {
    req.on('data', () => { });
    req.on('end', () => {
      seen.push(req.url);
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/v1/getinfo') {
        res.end(JSON.stringify({ version: '0.18.0-beta', alias: 'lnd', identity_pubkey: '02' + 'ab'.repeat(32) }));
      } else if (req.url === '/v1/channels/backup') {
        if (backup === 'fail') {
          res.statusCode = 500;
          res.end(JSON.stringify({ code: 2, message: 'backup failed' }));
        } else {
          res.end(backup === 'empty' ? '' : JSON.stringify(BACKUP));
        }
      } else if (req.url.startsWith('/v1/invoices')) {
        res.end(JSON.stringify({ invoices: [] }));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

// A node with its own macaroon and backup directories under root. macaroon: false leaves the
// macaroon directory out, so admin.macaroon cannot be read.
const makeNode = (root, index, url, { macaroon = true } = {}) => {
  const macaroonPath = join(root, `node-${index}`, 'macaroon');
  const channelBackupPath = join(root, `node-${index}`, 'backup');
  mkdirSync(channelBackupPath, { recursive: true });
  if (macaroon) {
    mkdirSync(macaroonPath, { recursive: true });
    writeFileSync(join(macaroonPath, 'admin.macaroon'), Buffer.from('mac-' + index));
  }
  return {
    index, lnNode: `node-${index}`, lnImplementation: 'LND',
    authentication: { macaroonPath },
    settings: { lnServerUrl: url, channelBackupPath, logLevel: 'ERROR' }
  };
};

const invoke = (selectedNode) => new Promise((resolve, reject) => {
  const out = { statusCode: null, body: null };
  const res = {
    status: (code) => { out.statusCode = code; return res; },
    json: (payload) => { out.body = payload; resolve(out); return res; }
  };
  try {
    getInfo({ session: { selectedNode } }, res, () => { });
  } catch (err) {
    reject(err);
  }
});

const backupFile = (node) => join(node.settings.channelBackupPath, 'channel-all.bak');

// The backups run alongside getinfo and are not awaited by it, so wait until each fake node has
// answered its backup call, then give the file write time to land.
const backupsSettled = async (...lnds) => {
  for (let i = 0; i < 100 && !lnds.every((lnd) => lnd.seen.includes('/v1/channels/backup')); i++) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
};

test('a configured node with an unreadable macaroon does not fail getinfo for the selected node', async () => {
  const lnd = await startFakeLnd();
  const root = mkdtempSync(join(tmpdir(), 'rtl-getinfo-'));
  const selected = makeNode(root, 1, lnd.url);
  const broken = makeNode(root, 2, lnd.url, { macaroon: false });
  Common.nodes = [selected, broken];
  try {
    const res = await invoke(selected);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.alias, 'lnd');
    await backupsSettled(lnd);
    assert.deepEqual(JSON.parse(readFileSync(backupFile(selected), 'utf-8')), BACKUP);
  } finally { await lnd.close(); }
});

for (const [mode, what] of [['fail', 'an error'], ['empty', 'an empty body']]) {
  test(`a node whose backup call answers ${what} keeps its stored channel-all.bak`, async () => {
    const healthy = await startFakeLnd();
    const down = await startFakeLnd(mode);
    const root = mkdtempSync(join(tmpdir(), 'rtl-getinfo-'));
    const selected = makeNode(root, 1, healthy.url);
    const other = makeNode(root, 2, down.url);
    writeFileSync(backupFile(other), OLD_BACKUP);
    Common.nodes = [selected, other];
    try {
      const res = await invoke(selected);
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      await backupsSettled(healthy, down);
      assert.equal(readFileSync(backupFile(other), 'utf-8'), OLD_BACKUP);
      assert.deepEqual(JSON.parse(readFileSync(backupFile(selected), 'utf-8')), BACKUP);
    } finally {
      await healthy.close();
      await down.close();
    }
  });
}

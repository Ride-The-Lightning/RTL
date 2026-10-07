import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after, afterEach, beforeEach, mock } from 'node:test';

import { getInfo } from '../../backend/controllers/lnd/getInfo.js';
import { addInvoice } from '../../backend/controllers/lnd/invoices.js';
import { Common } from '../../backend/utils/common.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// Every successful LND getinfo (the frontend polls it) fetched the node's open invoices and
// opened a new /v2/invoices/subscribe long poll for each, with no timeout, whether or not one
// was already open for that invoice. The open streams grew with every getinfo.

// Importing the controllers loads the websocket server, whose ping timer would otherwise keep
// the test process alive after the last test.
after(() => clearInterval(WSServer.pingInterval));

const saved = {};
beforeEach(() => {
  Object.assign(saved, { nodes: Common.nodes, wss: WSServer.webSocketServer });
  // getinfo also refreshes channel backups for every configured node; keep that out of the way.
  Common.nodes = [];
  // A running server's websocket server with no browser connected.
  WSServer.webSocketServer = { clients: new Set() };
});
afterEach(() => {
  Common.nodes = saved.nodes;
  WSServer.webSocketServer = saved.wss;
});

const hashOf = (n) => Buffer.alloc(32, n).toString('base64');
const OPEN = [1, 2, 3].map((n) => ({ r_hash: hashOf(n), state: 'OPEN' }));

// A fake LND that lists the open invoices and holds every invoice subscription open until the
// test ends it.
const startFakeLnd = async () => {
  const subscribes = [];
  const server = createServer((req, res) => {
    req.on('data', () => { });
    req.on('end', () => {
      const path = req.url.split('?')[0];
      if (path.startsWith('/v2/invoices/subscribe/')) {
        const sub = { hash: path.slice('/v2/invoices/subscribe/'.length), res, closed: false };
        res.on('close', () => { sub.closed = true; });
        subscribes.push(sub);
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      if (path === '/v1/getinfo') {
        res.end(JSON.stringify({ version: '0.18.0-beta', alias: 'lnd' }));
      } else if (path === '/v1/invoices' && req.method === 'GET') {
        res.end(JSON.stringify({ invoices: OPEN }));
      } else if (path === '/v1/invoices' && req.method === 'POST') {
        res.end(JSON.stringify({ r_hash: hashOf(1), payment_request: 'lnbcrt1' }));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    subscribes,
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => { server.closeAllConnections(); return new Promise((resolve) => server.close(resolve)); }
  };
};

const makeNode = (index, url) => {
  const macaroonPath = mkdtempSync(join(tmpdir(), 'rtl-mac-'));
  mkdirSync(macaroonPath, { recursive: true });
  writeFileSync(join(macaroonPath, 'admin.macaroon'), Buffer.from('mac-' + index));
  // The request options a session's node carries once RTL has set it up (setOptions).
  const options = { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': Buffer.from('mac-' + index).toString('hex') } };
  return {
    index, lnNode: 'node-' + index, lnImplementation: 'LND',
    authentication: { macaroonPath, options },
    settings: { lnServerUrl: url, logLevel: 'ERROR' }
  };
};

const invoke = (handler, req) => new Promise((resolve, reject) => {
  const out = { statusCode: null, body: null };
  const answer = (payload) => { out.body = payload; resolve(out); return res; };
  const res = { status: (code) => { out.statusCode = code; return res; }, json: answer, send: answer, end: answer };
  try {
    handler(req, res, (err) => reject(err || new Error('handler called next() without answering')));
  } catch (err) {
    reject(err);
  }
});

// Subscriptions are opened after getinfo has answered, without being awaited.
const settle = () => new Promise((resolve) => setTimeout(resolve, 300));

const openStreams = (lnd) => lnd.subscribes.filter((s) => !s.closed).length;

test('repeated getinfo opens one subscription per open invoice, not one per call', { timeout: 10000 }, async () => {
  const lnd = await startFakeLnd();
  const node = makeNode(11, lnd.url);
  try {
    for (let i = 0; i < 4; i++) {
      const res = await invoke(getInfo, { session: { selectedNode: node } });
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      await settle();
    }
    assert.equal(lnd.subscribes.length, 3, 'subscriptions opened: ' + lnd.subscribes.map((s) => s.hash).join(', '));
    assert.equal(new Set(lnd.subscribes.map((s) => s.hash)).size, 3);
  } finally { await lnd.close(); }
});

for (const [how, index] of [['with an error', 12], ['with an invoice update', 16]]) {
test(`a subscription that has ended ${how} is opened again on the next getinfo`, { timeout: 10000 }, async () => {
  const lnd = await startFakeLnd();
  const node = makeNode(index, lnd.url);
  try {
    await invoke(getInfo, { session: { selectedNode: node } });
    await settle();
    assert.equal(openStreams(lnd), 3, 'setup: three subscriptions open');

    // The node ends one stream: with an error, as a dropped connection would, or by sending
    // the invoice's update and closing.
    const ended = lnd.subscribes[0];
    if (how === 'with an error') {
      ended.res.statusCode = 500;
      ended.res.end(JSON.stringify({ code: 2, message: 'stream closed' }));
    } else {
      ended.res.setHeader('Content-Type', 'application/json');
      ended.res.end(JSON.stringify({ result: { r_hash: hashOf(1), state: 'OPEN' } }));
    }
    await settle();

    await invoke(getInfo, { session: { selectedNode: node } });
    await settle();
    assert.equal(lnd.subscribes.length, 4, 'subscriptions opened: ' + lnd.subscribes.map((s) => s.hash).join(', '));
    assert.equal(lnd.subscribes[3].hash, ended.hash, 'the ended invoice was not the one subscribed again');
    assert.equal(openStreams(lnd), 3);
  } finally { await lnd.close(); }
});
}

test('adding an invoice already being watched does not open a second subscription', { timeout: 10000 }, async () => {
  const lnd = await startFakeLnd();
  const node = makeNode(13, lnd.url);
  try {
    await invoke(getInfo, { session: { selectedNode: node } });
    await settle();
    assert.equal(lnd.subscribes.length, 3, 'setup: three subscriptions open');

    const req = { session: { selectedNode: node }, body: { value: '1000' } };
    const res = await invoke(addInvoice, req);
    assert.ok(String(res.statusCode).startsWith('2'), JSON.stringify(res.body));
    await settle();
    assert.equal(lnd.subscribes.length, 3, 'subscriptions opened: ' + lnd.subscribes.map((s) => s.hash).join(', '));
  } finally { await lnd.close(); }
});

test('the same invoice on two nodes is watched on each', { timeout: 10000 }, async () => {
  const lndA = await startFakeLnd();
  const lndB = await startFakeLnd();
  try {
    await invoke(getInfo, { session: { selectedNode: makeNode(14, lndA.url) } });
    await invoke(getInfo, { session: { selectedNode: makeNode(15, lndB.url) } });
    await settle();
    assert.equal(lndA.subscribes.length, 3);
    assert.equal(lndB.subscribes.length, 3);
  } finally {
    await lndA.close();
    await lndB.close();
  }
});

// A long poll can die without its connection closing (a NAT or proxy dropping it), and then it
// never settles. Past the age limit the next getinfo aborts it and subscribes again, without
// telling the browser about an error and without leaving the old stream open.
test('a subscription older than the limit is replaced on the next getinfo, not duplicated', { timeout: 10000 }, async () => {
  mock.timers.enable({ apis: ['Date'], now: Date.now() });
  const lnd = await startFakeLnd();
  const node = makeNode(17, lnd.url);
  const sent = [];
  WSServer.webSocketServer = { clients: new Set([{ clientNodeIndex: 17, send: (m) => sent.push(m) }]) };
  try {
    await invoke(getInfo, { session: { selectedNode: node } });
    await settle();
    assert.equal(lnd.subscribes.length, 3, 'setup: three subscriptions open');

    mock.timers.tick(9 * 60 * 1000);
    await invoke(getInfo, { session: { selectedNode: node } });
    await settle();
    assert.equal(lnd.subscribes.length, 3, 'replaced before the limit');

    mock.timers.tick(2 * 60 * 1000);
    await invoke(getInfo, { session: { selectedNode: node } });
    await settle();
    assert.equal(lnd.subscribes.length, 6, 'subscriptions opened: ' + lnd.subscribes.map((s) => s.hash).join(', '));
    assert.equal(openStreams(lnd), 3, 'old streams left open');
    assert.deepEqual(lnd.subscribes.slice(0, 3).map((s) => s.closed), [true, true, true]);
    assert.deepEqual(sent, [], 'replacing a stream was reported to the browser');
  } finally {
    mock.timers.reset();
    await lnd.close();
  }
});

test('a node whose server URL changed is subscribed on the new server', { timeout: 10000 }, async () => {
  const lndOld = await startFakeLnd();
  const lndNew = await startFakeLnd();
  try {
    await invoke(getInfo, { session: { selectedNode: makeNode(18, lndOld.url) } });
    await settle();
    assert.equal(lndOld.subscribes.length, 3, 'setup: three subscriptions open on the old server');

    await invoke(getInfo, { session: { selectedNode: makeNode(18, lndNew.url) } });
    await settle();
    assert.equal(lndNew.subscribes.length, 3, 'subscriptions on the new server: ' + lndNew.subscribes.length);
  } finally {
    await lndOld.close();
    await lndNew.close();
  }
});

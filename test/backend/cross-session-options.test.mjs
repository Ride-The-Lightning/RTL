import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test, { after } from 'node:test';

import { getAllChannels, getPendingChannels, getClosedChannels } from '../../backend/controllers/lnd/channels.js';
import { getQueryRoutes } from '../../backend/controllers/lnd/graph.js';
import { addInvoice } from '../../backend/controllers/lnd/invoices.js';
import { getChannels as getChannelsECL } from '../../backend/controllers/eclair/channels.js';
import { queryPaymentRoute } from '../../backend/controllers/eclair/payments.js';
import { getPeers as getPeersECL, connectPeer as connectPeerECL } from '../../backend/controllers/eclair/peers.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// Several LND and Eclair controllers kept the request's options in one module-level variable
// and read it again after the node answered, to make follow-up calls (alias lookups, invoice
// subscription). Every request reassigns that variable, so when two sessions on different
// nodes overlapped, the first session's follow-up calls could be built from the other
// request's options. Follow-up calls must use the options of the request that made them.
//
// Each test holds node A's first answer until session B's request has run to completion
// against node B, then releases it and checks the auth header on every call node A received.

// Importing the controllers loads the websocket server, whose ping timer would otherwise keep
// the test process alive after the last test.
after(() => clearInterval(WSServer.pingInterval));

const PUBKEY = '02' + 'ab'.repeat(32);
const RHASH = Buffer.from('cd'.repeat(32), 'hex').toString('base64');

// A fake node that answers by path and records the auth header on every request. The first
// request for gatePath is held until release() is called.
const startNode = async (credHeader, responses, gatePath) => {
  const seen = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let gateHit;
  const gateReached = new Promise((resolve) => { gateHit = resolve; });
  let gated = false;
  const server = createServer((req, res) => {
    req.on('data', () => { });
    req.on('end', async () => {
      const path = req.url.split('?')[0];
      seen.push({ path, cred: req.headers[credHeader] });
      if (path === gatePath && !gated) {
        gated = true;
        gateHit();
        await gate;
      }
      const key = Object.keys(responses).filter((p) => path.startsWith(p)).sort((a, b) => b.length - a.length)[0];
      res.writeHead(key ? 200 : 404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(key ? responses[key] : {}));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    seen, release, gateReached,
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => { release(); return new Promise((resolve) => server.close(resolve)); }
  };
};

const session = (impl, index, url, headers) => ({
  selectedNode: {
    index, lnNode: 'node-' + index, lnImplementation: impl,
    authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers } },
    settings: { lnServerUrl: url, logLevel: 'ERROR' }
  }
});

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

const LND = {
  impl: 'LND',
  credHeader: 'grpc-metadata-macaroon',
  headers: (cred) => ({ 'Grpc-Metadata-macaroon': cred })
};
const ECL = {
  impl: 'ECL',
  credHeader: 'authorization',
  headers: (cred) => ({ authorization: cred })
};

const cases = [
  { name: 'LND getAllChannels', impl: LND, handler: getAllChannels, gate: '/v1/channels', req: { query: {} },
    responses: { '/v1/channels': { channels: [{ remote_pubkey: PUBKEY, local_balance: '1', remote_balance: '1' }] }, '/v1/graph/node/': { node: { alias: 'peer', pub_key: PUBKEY } } } },
  { name: 'LND getPendingChannels', impl: LND, handler: getPendingChannels, gate: '/v1/channels/pending', req: { query: {} },
    responses: { '/v1/channels/pending': { pending_open_channels: [{ channel: { remote_node_pub: PUBKEY } }] }, '/v1/graph/node/': { node: { alias: 'peer', pub_key: PUBKEY } } } },
  { name: 'LND getClosedChannels', impl: LND, handler: getClosedChannels, gate: '/v1/channels/closed', req: { query: {} },
    responses: { '/v1/channels/closed': { channels: [{ remote_pubkey: PUBKEY }] }, '/v1/graph/node/': { node: { alias: 'peer', pub_key: PUBKEY } } } },
  { name: 'LND getQueryRoutes', impl: LND, handler: getQueryRoutes, gate: '/v1/graph/routes/' + PUBKEY + '/1000', req: { params: { destPubkey: PUBKEY, amount: '1000' } },
    responses: { '/v1/graph/routes/': { routes: [{ hops: [{ pub_key: PUBKEY }] }] }, '/v1/graph/node/': { node: { alias: 'peer', pub_key: PUBKEY } } } },
  { name: 'LND addInvoice', impl: LND, handler: addInvoice, gate: '/v1/invoices', req: { body: { value: '1000', memo: 'test' } },
    responses: { '/v1/invoices': { r_hash: RHASH, payment_request: 'lnbcrt1' }, '/v2/invoices/subscribe/': {} },
    // The invoice subscription is started without being awaited, so wait for it.
    settle: (node) => node.seen.some((r) => r.path.startsWith('/v2/invoices/subscribe/')) },
  { name: 'Eclair getChannels', impl: ECL, handler: getChannelsECL, gate: '/channels', req: { query: {} },
    responses: { '/channels': [{ nodeId: PUBKEY, channelId: 'chan-1', state: 'NORMAL' }], '/nodes': [{ nodeId: PUBKEY, alias: 'peer' }] } },
  { name: 'Eclair queryPaymentRoute', impl: ECL, handler: queryPaymentRoute, gate: '/findroutetonode', req: { query: { nodeId: PUBKEY, amountMsat: '1000' } },
    responses: { '/findroutetonode': { routes: [{ nodeIds: [PUBKEY] }] }, '/nodes': [{ nodeId: PUBKEY, alias: 'peer' }] } },
  { name: 'Eclair getPeers', impl: ECL, handler: getPeersECL, gate: '/peers', req: { query: {} },
    responses: { '/peers': [{ nodeId: PUBKEY }], '/nodes': [{ nodeId: PUBKEY, alias: 'peer' }] } },
  { name: 'Eclair connectPeer', impl: ECL, handler: connectPeerECL, gate: '/connect', req: { query: { uri: PUBKEY + '@127.0.0.1:9735' } },
    responses: { '/connect': 'connected', '/peers': [{ nodeId: PUBKEY }], '/nodes': [{ nodeId: PUBKEY, alias: 'peer' }] } }
];

const until = async (check) => {
  for (let i = 0; i < 200 && !check(); i++) { await new Promise((resolve) => setTimeout(resolve, 10)); }
};

for (const c of cases) {
  test(`${c.name}: follow-up calls keep their own request's options when another session overlaps`, { timeout: 10000 }, async () => {
    const credA = 'auth-of-node-a';
    const credB = 'auth-of-node-b';
    const nodeA = await startNode(c.impl.credHeader, c.responses, c.gate);
    const nodeB = await startNode(c.impl.credHeader, c.responses, null);
    try {
      const reqA = { ...c.req, session: session(c.impl.impl, 1, nodeA.url, c.impl.headers(credA)) };
      const reqB = { ...c.req, session: session(c.impl.impl, 2, nodeB.url, c.impl.headers(credB)) };

      const resA = invoke(c.handler, reqA);
      await nodeA.gateReached;
      const resB = await invoke(c.handler, reqB);
      if (c.settle) { await until(() => c.settle(nodeB)); }
      nodeA.release();
      const outA = await resA;
      if (c.settle) { await until(() => c.settle(nodeA)); }

      assert.ok(String(outA.statusCode).startsWith('2'), 'session A: ' + outA.statusCode + ' ' + JSON.stringify(outA.body));
      assert.ok(String(resB.statusCode).startsWith('2'), 'session B: ' + resB.statusCode + ' ' + JSON.stringify(resB.body));
      assert.ok(nodeA.seen.length > 1, 'session A made no follow-up call: ' + JSON.stringify(nodeA.seen));
      assert.deepEqual(nodeA.seen.filter((r) => r.cred !== credA), [], "node A received a call built from another request's options");
      assert.deepEqual(nodeB.seen.filter((r) => r.cred !== credB), [], "node B received a call built from another request's options");
    } finally {
      await nodeA.close();
      await nodeB.close();
    }
  });
}

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { getPeers, postPeer } from '../../backend/controllers/lnd/peers.js';

// The LND peers controllers keep the current request's options in a module-level `options`
// binding that every handler reassigns on entry. The alias lookups run *after* the peer
// list round trip (and behind a concurrency limiter), so a request for another node that
// arrives in that window used to swap the object under them: node A's alias lookups went
// out carrying node B's macaroon (#1662, the one site #1651 did not cover). These tests
// pin the fix — every request a handler issues after an async boundary must use the
// options snapshotted on entry, never the module binding.
//
// Each fake node is a real HTTP server that, like LND, rejects any request not carrying
// its own macaroon, so a credential mix-up is observable both in what the servers record
// and in the response the controller sends.

const startFakeLnd = async (name, macaroon, peers) => {
  const seen = [];
  let holdPeersList = null;
  let peersListRequested;
  let signalPeersListRequested;

  const armHold = () => {
    peersListRequested = new Promise((resolve) => { signalPeersListRequested = resolve; });
    holdPeersList = { pending: null };
  };

  const server = createServer((req, res) => {
    const record = { method: req.method, path: req.url, macaroon: req.headers['grpc-metadata-macaroon'] };
    seen.push(record);
    const reply = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (record.macaroon !== macaroon) { return reply(401, { message: 'invalid macaroon' }); }
    if (req.method === 'POST' && req.url === '/v1/peers') {
      req.resume();
      if (holdPeersList) { holdPeersList.pending = () => reply(200, {}); signalPeersListRequested(); return; }
      return reply(200, {});
    }
    if (req.method === 'GET' && req.url === '/v1/peers') {
      if (holdPeersList) { holdPeersList.pending = () => reply(200, { peers }); signalPeersListRequested(); return; }
      return reply(200, { peers });
    }
    const graph = req.url.match(/^\/v1\/graph\/node\/(.+)$/);
    if (req.method === 'GET' && graph) { return reply(200, { node: { alias: `${name}:${graph[1]}` } }); }
    reply(404, { message: 'unexpected ' + req.method + ' ' + req.url });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;

  return {
    name, macaroon, url, seen,
    // Hold the *next* peer-list (or connect) response until release() is called, and expose
    // a promise that resolves once the controller's request has actually arrived.
    hold: () => { armHold(); return { requested: () => peersListRequested, release: () => { const p = holdPeersList.pending; holdPeersList = null; p(); } }; },
    graphRequests: () => seen.filter((r) => r.path.startsWith('/v1/graph/node/')),
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

const buildRequest = (node, body = {}) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: node.name,
      lnImplementation: 'LND',
      authentication: {
        options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': node.macaroon } }
      },
      settings: { lnServerUrl: node.url, logLevel: 'ERROR' }
    }
  },
  body,
  query: {}
});

const buildResponse = () => {
  const out = { statusCode: null, body: null, headersSent: false };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; out.headersSent = true; resolve(payload); return out; };
  });
  return out;
};

test('getPeers: alias lookups keep node A\'s options when node B\'s request lands mid-flight', async () => {
  const nodeA = await startFakeLnd('A', 'macaroon-A', [{ pub_key: 'peer-a1' }, { pub_key: 'peer-a2' }]);
  const nodeB = await startFakeLnd('B', 'macaroon-B', []);
  try {
    const gate = nodeA.hold();
    const resA = buildResponse();
    getPeers(buildRequest(nodeA), resA, null);
    await gate.requested();

    // Node B's request arrives while A's peer list is still in flight: this reassigns the
    // module-level `options` to B's object. Let it finish before releasing A.
    const resB = buildResponse();
    getPeers(buildRequest(nodeB), resB, null);
    await resB.done;
    assert.equal(resB.statusCode, 200);

    gate.release();
    await resA.done;

    assert.equal(resA.statusCode, 200, JSON.stringify(resA.body));
    assert.deepEqual(resA.body.map((p) => p.alias), ['A:peer-a1', 'A:peer-a2']);
    // The alias lookups went to A, with A's macaroon — never to B, never with B's macaroon.
    assert.equal(nodeA.graphRequests().length, 2);
    assert.ok(nodeA.graphRequests().every((r) => r.macaroon === 'macaroon-A'), JSON.stringify(nodeA.seen));
    assert.equal(nodeB.graphRequests().length, 0, JSON.stringify(nodeB.seen));
  } finally {
    await nodeA.close();
    await nodeB.close();
  }
});

test('postPeer: the follow-up peer list and alias lookups keep node A\'s options across the connect round trip', async () => {
  const nodeA = await startFakeLnd('A', 'macaroon-A', [{ pub_key: 'peer-new' }, { pub_key: 'peer-old' }]);
  const nodeB = await startFakeLnd('B', 'macaroon-B', []);
  try {
    const gate = nodeA.hold();
    const resA = buildResponse();
    postPeer(buildRequest(nodeA, { host: '10.0.0.1:9735', pubkey: 'peer-new', perm: false }), resA, null);
    await gate.requested();

    const resB = buildResponse();
    getPeers(buildRequest(nodeB), resB, null);
    await resB.done;
    assert.equal(resB.statusCode, 200);

    gate.release();
    await resA.done;

    assert.equal(resA.statusCode, 201, JSON.stringify(resA.body));
    assert.deepEqual(resA.body.map((p) => p.pub_key), ['peer-new', 'peer-old']);
    assert.deepEqual(resA.body.map((p) => p.alias), ['A:peer-new', 'A:peer-old']);
    // Connect, the follow-up list and both alias lookups all hit A with A's macaroon.
    const aPaths = nodeA.seen.map((r) => `${r.method} ${r.path}`);
    assert.deepEqual(aPaths.slice(0, 2), ['POST /v1/peers', 'GET /v1/peers']);
    assert.equal(nodeA.graphRequests().length, 2);
    assert.ok(nodeA.seen.every((r) => r.macaroon === 'macaroon-A'), JSON.stringify(nodeA.seen));
    assert.equal(nodeB.seen.filter((r) => r.path !== '/v1/peers').length, 0, JSON.stringify(nodeB.seen));
  } finally {
    await nodeA.close();
    await nodeB.close();
  }
});

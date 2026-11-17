import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { loopIn } from '../../backend/controllers/shared/loop.js';

// #1817: the Loop In dialog used to post `externalHtlc: true` and `lastHop: ''` along with the
// amount and fees. The controller has never forwarded either, so loopd funds the on-chain HTLC
// from the node's own wallet. That is the behaviour the dialog implies: it has no step asking
// the user to pay the HTLC from another wallet, so a forwarded `external_htlc` would leave
// every swap unfunded. A client that still sends those fields must not be able to switch it on.

const startFakeLoop = async () => {
  const seen = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      seen.push({ method: req.method, path: req.url, body: JSON.parse(raw) });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'ab'.repeat(32), htlc_address: 'bcrt1qexample' }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (swapServerUrl, body) => ({
  session: { selectedNode: { index: 1, lnNode: 'node', lnImplementation: 'LND', authentication: {}, settings: { swapServerUrl, logLevel: 'ERROR' } } },
  query: {},
  params: {},
  body
});

const buildResponse = () => {
  const out = { statusCode: null, body: null };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  return out;
};

const run = async (handler, req) => { const res = buildResponse(); handler(req, res, null); await res.done; return res; };

const expected = { amt: 250000, max_swap_fee: 600, max_miner_fee: 3875, initiator: 'RTL' };

test('loopIn: sends loopd the amount, the fee limits and the initiator', async () => {
  const loop = await startFakeLoop();
  try {
    const res = await run(loopIn, buildRequest(loop.url, { amount: 250000, swapFee: 600, minerFee: 3875 }));
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.htlc_address, 'bcrt1qexample');
    assert.deepEqual(loop.seen, [{ method: 'POST', path: '/v1/loop/in', body: expected }]);
  } finally { await loop.close(); }
});

test('loopIn: a client cannot ask for an externally funded HTLC or a last hop', async () => {
  const loop = await startFakeLoop();
  try {
    const body = { amount: 250000, swapFee: 600, minerFee: 3875, externalHtlc: true, external_htlc: true, lastHop: '02'.repeat(33), last_hop: 'Ag==' };
    const res = await run(loopIn, buildRequest(loop.url, body));
    assert.equal(res.statusCode, 201);
    assert.deepEqual(loop.seen.map((r) => r.body), [expected]);
  } finally { await loop.close(); }
});

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { getAliasesForPubkeys, getGraphEdge, getGraphNode, getQueryRoutes, getRemoteFeePolicy } from '../../backend/controllers/lnd/graph.js';
import { decodePayment, decodePayments, paymentLookup } from '../../backend/controllers/lnd/payments.js';
import { deletePeer } from '../../backend/controllers/lnd/peers.js';

// The LND handlers that put a path parameter into the upstream URL forwarded it as received.
// Express has already percent-decoded it by then, so a value holding "/", ".." or "?" changed
// which LND endpoint the request reached. Each handler now checks the value's form first and
// answers 400 for anything else; the two list handlers skip the entries that do not fit.
// Surrounding whitespace, which LND ignored, is dropped rather than refused.

const startFakeServer = async (reply = () => ({})) => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reply(req.url)));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (url, { query = {}, params = {}, body = {} } = {}) => ({
  session: {
    selectedNode: {
      index: 1, lnNode: 'test-node', lnImplementation: 'LND', lnVersion: '0.18.0',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': 'mac' } } },
      settings: { lnServerUrl: url, logLevel: 'ERROR' }
    }
  },
  query,
  params,
  body
});

const run = async (handler, req) => {
  const out = { statusCode: null, body: null };
  const done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  handler(req, out, null);
  await Promise.race([done, new Promise((resolve) => setTimeout(resolve, 500))]);
  return out;
};

const PUBKEY = '02' + 'ab'.repeat(32);
const OTHER_PUBKEY = '03' + 'cd'.repeat(32);
const CHAN_ID = '123456789012345678';
const PAY_REQ = 'lnbcrt10u1p5examplepp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4js';
// A payment hash as the lookup view sends it: base64 with "-" and "_", padding kept.
const PAYMENT_HASH = Buffer.from('fb'.repeat(32), 'hex').toString('base64').replace(/\+/g, '-').replace(/[/]/g, '_');

// What Express hands the handler after decoding %2F, %3F and friends in a path parameter.
const reshaped = (value) => ['../getinfo', `${value}/../../getinfo`, `${value}?x=1`, `${value}&x=1`, `${value}#x`, `${value} x`, '..', ['a', 'b'], undefined];

const HANDLERS = [
  { name: 'getGraphNode', handler: getGraphNode, method: 'GET', valid: { pubKey: PUBKEY }, expected: `/v1/graph/node/${PUBKEY}`, param: 'pubKey' },
  { name: 'getGraphEdge', handler: getGraphEdge, method: 'GET', valid: { chanid: CHAN_ID }, expected: `/v1/graph/edge/${CHAN_ID}`, param: 'chanid' },
  { name: 'getRemoteFeePolicy', handler: getRemoteFeePolicy, method: 'GET', valid: { chanid: CHAN_ID, localPubkey: PUBKEY }, expected: `/v1/graph/edge/${CHAN_ID}`, param: 'chanid' },
  { name: 'getQueryRoutes (destPubkey)', handler: getQueryRoutes, method: 'GET', valid: { destPubkey: PUBKEY, amount: '1000' }, expected: `/v1/graph/routes/${PUBKEY}/1000`, param: 'destPubkey' },
  { name: 'getQueryRoutes (amount)', handler: getQueryRoutes, method: 'GET', valid: { destPubkey: PUBKEY, amount: '1000' }, expected: `/v1/graph/routes/${PUBKEY}/1000`, param: 'amount' },
  { name: 'decodePayment', handler: decodePayment, method: 'GET', valid: { payRequest: PAY_REQ }, expected: `/v1/payreq/${PAY_REQ}`, param: 'payRequest' },
  { name: 'paymentLookup', handler: paymentLookup, method: 'GET', valid: { paymentHash: PAYMENT_HASH }, expected: `/v2/router/track/${PAYMENT_HASH}`, param: 'paymentHash' },
  { name: 'deletePeer', handler: deletePeer, method: 'DELETE', valid: { peerPubKey: PUBKEY }, expected: `/v1/peers/${PUBKEY}`, param: 'peerPubKey' }
];

for (const h of HANDLERS) {
  test(`${h.name}: a well-formed value reaches the expected LND endpoint`, async () => {
    const lnd = await startFakeServer();
    try {
      const res = await run(h.handler, buildRequest(lnd.url, { params: h.valid }));
      assert.ok(res.statusCode >= 200 && res.statusCode < 300, JSON.stringify(res.body));
      assert.deepEqual(lnd.seen, [{ method: h.method, path: h.expected }]);
    } finally { await lnd.close(); }
  });

  test(`${h.name}: a malformed value is refused with 400 and never sent upstream`, async () => {
    const lnd = await startFakeServer();
    try {
      for (const bad of reshaped(h.valid[h.param])) {
        const res = await run(h.handler, buildRequest(lnd.url, { params: { ...h.valid, [h.param]: bad } }));
        assert.equal(res.statusCode, 400, `accepted ${JSON.stringify(bad)}`);
      }
      assert.equal(lnd.seen.length, 0, JSON.stringify(lnd.seen));
    } finally { await lnd.close(); }
  });

  test(`${h.name}: surrounding whitespace is dropped before the value is forwarded`, async () => {
    const lnd = await startFakeServer();
    try {
      const res = await run(h.handler, buildRequest(lnd.url, { params: { ...h.valid, [h.param]: ` ${h.valid[h.param]}\n` } }));
      assert.ok(res.statusCode >= 200 && res.statusCode < 300, JSON.stringify(res.body));
      assert.deepEqual(lnd.seen, [{ method: h.method, path: h.expected }]);
    } finally { await lnd.close(); }
  });
}

test('paymentLookup: the payment hash is forwarded with its padding intact', async () => {
  const lnd = await startFakeServer();
  try {
    assert.ok(PAYMENT_HASH.endsWith('='));
    await run(paymentLookup, buildRequest(lnd.url, { params: { paymentHash: PAYMENT_HASH } }));
    assert.equal(lnd.seen[0].path, `/v2/router/track/${PAYMENT_HASH}`);
    // Standard base64 worked whenever the hash held no "/", so "+" is still let through.
    const plus = `+${'A'.repeat(42)}=`;
    await run(paymentLookup, buildRequest(lnd.url, { params: { paymentHash: plus } }));
    assert.equal(lnd.seen[1].path, `/v2/router/track/${plus}`);
  } finally { await lnd.close(); }
});

test('decodePayment: an upper-case payment request is accepted', async () => {
  const lnd = await startFakeServer();
  try {
    const res = await run(decodePayment, buildRequest(lnd.url, { params: { payRequest: PAY_REQ.toUpperCase() } }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(lnd.seen[0].path, `/v1/payreq/${PAY_REQ.toUpperCase()}`);
  } finally { await lnd.close(); }
});

test('getAliasesForPubkeys: only well-formed public keys are looked up, the rest keep the fallback label', async () => {
  const lnd = await startFakeServer(() => ({ node: { alias: 'alice' } }));
  try {
    const pubkeys = [PUBKEY, '../../getinfo', `${OTHER_PUBKEY}?include_channels=true`, OTHER_PUBKEY].join(',');
    const res = await run(getAliasesForPubkeys, buildRequest(lnd.url, { query: { pubkeys } }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body, ['alice', '../../getinfo', OTHER_PUBKEY.substring(0, 20), 'alice']);
    assert.deepEqual(lnd.seen.map((r) => r.path).sort(), [`/v1/graph/node/${PUBKEY}`, `/v1/graph/node/${OTHER_PUBKEY}`].sort());
  } finally { await lnd.close(); }
});

test('getAliasesForPubkeys: a repeated pubkeys parameter is refused with 400', async () => {
  const lnd = await startFakeServer();
  try {
    const res = await run(getAliasesForPubkeys, buildRequest(lnd.url, { query: { pubkeys: [PUBKEY, OTHER_PUBKEY] } }));
    assert.equal(res.statusCode, 400, JSON.stringify(res.body));
    assert.equal(lnd.seen.length, 0);
  } finally { await lnd.close(); }
});

test('getAliasesForPubkeys: no pubkeys still answers an empty list', async () => {
  const lnd = await startFakeServer();
  try {
    const res = await run(getAliasesForPubkeys, buildRequest(lnd.url));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, []);
  } finally { await lnd.close(); }
});

test('decodePayments: only well-formed payment requests are decoded, the rest come back empty', async () => {
  const lnd = await startFakeServer(() => ({ description: 'coffee' }));
  try {
    const payments = [PAY_REQ, '../getinfo', `${PAY_REQ}/../../getinfo`].join(',');
    const res = await run(decodePayments, buildRequest(lnd.url, { body: { payments } }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body, [{ description: 'coffee' }, undefined, undefined]);
    assert.deepEqual(lnd.seen, [{ method: 'GET', path: `/v1/payreq/${PAY_REQ}` }]);
  } finally { await lnd.close(); }
});

test('decodePayments: a payments value that is not a string is refused with 400', async () => {
  const lnd = await startFakeServer();
  try {
    const res = await run(decodePayments, buildRequest(lnd.url, { body: { payments: [PAY_REQ] } }));
    assert.equal(res.statusCode, 400, JSON.stringify(res.body));
    assert.equal(lnd.seen.length, 0);
  } finally { await lnd.close(); }
});

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { closeChannel } from '../../backend/controllers/lnd/channels.js';
import { invoiceLookup } from '../../backend/controllers/lnd/invoices.js';
import { getNewAddress } from '../../backend/controllers/lnd/newAddress.js';
import { getUTXOs } from '../../backend/controllers/lnd/wallet.js';
import { loopInQuote, loopInTermsAndQuotes, loopOutQuote, loopOutTermsAndQuotes } from '../../backend/controllers/shared/loop.js';

// #1698: handlers that glued req.query / req.params straight into the upstream URL sent the
// literal string "undefined" for an omitted parameter (LND answers 400) and let a value
// containing "&" smuggle extra parameters upstream. Each handler now builds its query through
// options.qs, omits what is absent and rejects what is malformed with a 400 of its own.

const startFakeServer = async (reply = () => ({})) => {
  const seen = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      seen.push({ method: req.method, path: req.url, body });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reply(req.url)));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (url, { query = {}, params = {}, lnVersion = '0.18.0' } = {}) => ({
  session: {
    selectedNode: {
      index: 1, lnNode: 'test-node', lnImplementation: 'LND', lnVersion,
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': 'mac' } } },
      settings: { lnServerUrl: url, swapServerUrl: url, logLevel: 'ERROR' }
    }
  },
  query,
  params
});

const buildResponse = () => {
  const out = { statusCode: null, body: null };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  return out;
};

// Waits for the fire-and-forget request behind closeChannel's 202.
const nextTick = () => new Promise((resolve) => setTimeout(resolve, 50));

const run = async (handler, req) => {
  const res = buildResponse();
  handler(req, res, null);
  await Promise.race([res.done, nextTick()]);
  await nextTick();
  return res;
};

const TXID = 'ab'.repeat(32);

const HANDLERS = [
  { name: 'invoiceLookup', handler: invoiceLookup, valid: { query: { payment_hash: 'abc' } }, expected: '/v2/invoices/lookup?payment_hash=abc', bad: { query: { payment_hash: '' } } },
  { name: 'getNewAddress', handler: getNewAddress, valid: { query: {} }, expected: '/v1/newaddress', bad: { query: { type: 'p2tr&x=1' } } },
  { name: 'closeChannel', handler: closeChannel, valid: { query: {}, params: { channelPoint: `${TXID}:1` } }, expected: `/v1/channels/${TXID}/1`, bad: { query: { force: 'maybe' }, params: { channelPoint: `${TXID}:1` } } },
  { name: 'getUTXOs (pre-0.14)', handler: getUTXOs, valid: { query: {}, lnVersion: '0.13.0' }, expected: '/v2/wallet/utxos', bad: { query: { max_confs: '-1' }, lnVersion: '0.13.0' } },
  { name: 'getUTXOs (0.14+)', handler: getUTXOs, valid: { query: {} }, expected: '/v2/wallet/utxos', bad: { query: { max_confs: '1e3' } } }
];

for (const h of HANDLERS) {
  test(`${h.name}: omitted parameters are left out of the upstream URL`, async () => {
    const lnd = await startFakeServer();
    try {
      const res = await run(h.handler, buildRequest(lnd.url, h.valid));
      assert.notEqual(res.statusCode, 400, JSON.stringify(res.body));
      assert.equal(lnd.seen.length, 1);
      assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
      assert.ok(!lnd.seen[0].body.includes('undefined'), `body contained undefined: ${lnd.seen[0].body}`);
      assert.equal(lnd.seen[0].path, h.expected);
    } finally { await lnd.close(); }
  });

  test(`${h.name}: a malformed parameter is refused with 400 and never sent upstream`, async () => {
    const lnd = await startFakeServer();
    try {
      const res = await run(h.handler, buildRequest(lnd.url, h.bad));
      assert.equal(res.statusCode, 400, JSON.stringify(res.body));
      assert.equal(lnd.seen.length, 0);
    } finally { await lnd.close(); }
  });
}

test('closeChannel: present parameters are forwarded encoded', async () => {
  const lnd = await startFakeServer();
  try {
    await run(closeChannel, buildRequest(lnd.url, { query: { force: 'true', target_conf: '6' }, params: { channelPoint: `${TXID}:1` } }));
    assert.equal(lnd.seen[0].path, `/v1/channels/${TXID}/1?force=true&target_conf=6`);
  } finally { await lnd.close(); }
});

test('closeChannel: a channelPoint that is not a txid:index outpoint is refused with 400', async () => {
  const lnd = await startFakeServer();
  try {
    for (const channelPoint of [`${TXID}:0?force=true`, '../v1/peers/abc:0', 'aa:1', undefined]) {
      const res = await run(closeChannel, buildRequest(lnd.url, { params: { channelPoint } }));
      assert.equal(res.statusCode, 400, `accepted ${channelPoint}`);
    }
    assert.equal(lnd.seen.length, 0);
  } finally { await lnd.close(); }
});

test('empty query values are treated as absent, as the replaced code did', async () => {
  const lnd = await startFakeServer();
  try {
    await run(closeChannel, buildRequest(lnd.url, { query: { force: '', target_conf: '', sat_per_vbyte: '' }, params: { channelPoint: `${TXID}:1` } }));
    assert.equal(lnd.seen[0].path, `/v1/channels/${TXID}/1`);
    await run(invoiceLookup, buildRequest(lnd.url, { query: { payment_addr: '', payment_hash: 'abc' } }));
    assert.equal(lnd.seen[1].path, '/v2/invoices/lookup?payment_hash=abc');
  } finally { await lnd.close(); }
});

test('getUTXOs (0.14+): max_confs is sent in the JSON body only when given', async () => {
  const lnd = await startFakeServer();
  try {
    await run(getUTXOs, buildRequest(lnd.url, { query: { max_confs: '100' } }));
    assert.equal(lnd.seen[0].body, '{"max_confs":100}');
  } finally { await lnd.close(); }
});

// Options are built per request from the session (#1714), so no prior loopInfo is needed.
test('loop quote handlers work without a prior loopInfo call', async () => {
  const loop = await startFakeServer();
  try {
    const res = await run(loopOutQuote, buildRequest(loop.url, { params: { amount: '1000' } }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(loop.seen[0].path, '/v1/loop/out/quote/1000?conf_target=2');
  } finally { await loop.close(); }
});

const LOOP_QUOTES = [
  { name: 'loopOutQuote', handler: loopOutQuote, prefix: '/v1/loop/out/quote/' },
  { name: 'loopInQuote', handler: loopInQuote, prefix: '/v1/loop/in/quote/' }
];

for (const q of LOOP_QUOTES) {
  test(`${q.name}: omitted or empty deadline is left out, empty or zero targetConf keeps the default`, async () => {
    const loop = await startFakeServer();
    try {
      const res = await run(q.handler, buildRequest(loop.url, { params: { amount: '250000' } }));
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      assert.equal(loop.seen[0].path, `${q.prefix}250000?conf_target=2`);
      assert.equal(res.body.amount, 250000);
      await run(q.handler, buildRequest(loop.url, { params: { amount: '250000' }, query: { targetConf: '', swapPublicationDeadline: '' } }));
      assert.equal(loop.seen[1].path, `${q.prefix}250000?conf_target=2`);
      await run(q.handler, buildRequest(loop.url, { params: { amount: '250000' }, query: { targetConf: '0' } }));
      assert.equal(loop.seen[2].path, `${q.prefix}250000?conf_target=2`);
    } finally { await loop.close(); }
  });

  test(`${q.name}: malformed amount or deadline is refused with 400`, async () => {
    const loop = await startFakeServer();
    try {
      const before = loop.seen.length;
      const bad1 = await run(q.handler, buildRequest(loop.url, { params: { amount: '1&x=2' } }));
      const bad2 = await run(q.handler, buildRequest(loop.url, { params: { amount: '1' }, query: { swapPublicationDeadline: 'soon' } }));
      assert.equal(bad1.statusCode, 400);
      assert.equal(bad2.statusCode, 400);
      assert.equal(loop.seen.length, before);
    } finally { await loop.close(); }
  });
}

const LOOP_TERMS = [
  { name: 'loopOutTermsAndQuotes', handler: loopOutTermsAndQuotes, prefix: '/v1/loop/out/quote/' },
  { name: 'loopInTermsAndQuotes', handler: loopInTermsAndQuotes, prefix: '/v1/loop/in/quote/' }
];

for (const t of LOOP_TERMS) {
  test(`${t.name}: quotes the min and max amounts separately with the given query`, async () => {
    const loop = await startFakeServer((path) => (path.endsWith('/terms') ? { min_swap_amount: '1000', max_swap_amount: '9000' } : {}));
    try {
      const res = await run(t.handler, buildRequest(loop.url, { query: { targetConf: '3', swapPublicationDeadline: '1700000000000' } }));
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      const quotes = loop.seen.filter((r) => r.path.startsWith(t.prefix)).map((r) => r.path).sort();
      assert.deepEqual(quotes, [
        `${t.prefix}1000?conf_target=3&swap_publication_deadline=1700000000000`,
        `${t.prefix}9000?conf_target=3&swap_publication_deadline=1700000000000`
      ]);
      assert.deepEqual(res.body.map((v) => v.amount), [1000, 9000]);
    } finally { await loop.close(); }
  });

  test(`${t.name}: malformed targetConf is refused with 400 before the terms call`, async () => {
    const loop = await startFakeServer();
    try {
      const before = loop.seen.length;
      const res = await run(t.handler, buildRequest(loop.url, { query: { targetConf: '2.5' } }));
      assert.equal(res.statusCode, 400);
      assert.equal(loop.seen.length, before);
    } finally { await loop.close(); }
  });
}

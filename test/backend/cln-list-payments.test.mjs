import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { listPayments } from '../../backend/controllers/cln/payments.js';

// listPayments decodes the bolt11 of every payment to show its memo. It started all the decode
// calls at once, after the list had come back, through a helper that read the controller's
// shared options object, which another session's request may have replaced by then. The
// decodes now run at most 20 at a time, each with a copy of the request's own options.

const COUNT = 60;

// A fake Core Lightning that answers after a short delay, so calls overlap and can be counted.
const startFakeCln = async (count = COUNT) => {
  const seen = [];
  const load = { inFlight: 0, max: 0 };
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : {};
      seen.push({ path: req.url, body, rune: req.headers.rune });
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/v1/listsendpays') {
        const payments = Array.from({ length: count }, (_, i) => ({ payment_hash: i.toString(16).padStart(64, '0'), status: 'complete', amount_msat: 1000, amount_sent_msat: 1001, created_at: 1700000000 + i, bolt11: 'lnbcrt1invoice' + i }));
        if (count > 0) { payments.push({ payment_hash: 'f'.repeat(64), status: 'complete', amount_msat: 1000, amount_sent_msat: 1001, created_at: 1700009999 }); }
        return setTimeout(() => res.end(JSON.stringify({ payments })), 40);
      }
      load.inFlight++;
      load.max = Math.max(load.max, load.inFlight);
      return setTimeout(() => {
        load.inFlight--;
        res.end(JSON.stringify({ description: 'memo for ' + body.string }));
      }, 20);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, load, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (url, rune = 'rune') => ({
  session: {
    selectedNode: {
      index: 1, lnNode: 'cln-node', lnImplementation: 'CLN',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { rune } } },
      settings: { lnServerUrl: url, logLevel: 'ERROR' }
    }
  },
  query: {},
  params: {},
  body: {}
});

const run = (req) => new Promise((resolve) => {
  const out = { statusCode: null, body: null };
  out.status = (code) => { out.statusCode = code; return out; };
  out.json = (payload) => { out.body = payload; resolve(out); return out; };
  listPayments(req, out, null);
});

test('listPayments: memos are decoded at most 20 at a time and land on the right payment', async () => {
  const cln = await startFakeCln();
  try {
    const res = await run(buildRequest(cln.url));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.length, COUNT + 1);
    for (const payment of res.body) {
      assert.equal(payment.memo, payment.bolt11 ? 'memo for ' + payment.bolt11 : '');
    }
    assert.equal(cln.seen.filter((r) => r.path === '/v1/decode').length, COUNT);
    assert.ok(cln.load.max <= 20, `${cln.load.max} calls in flight`);
    assert.ok(cln.load.max > 1, 'calls no longer overlap');
  } finally { await cln.close(); }
});

test('listPayments: the memo decodes keep the request\'s own credentials when another session makes a request', async () => {
  const cln = await startFakeCln();
  try {
    const first = run(buildRequest(cln.url, 'first'));
    // Lands while the first session is still waiting for its payment list.
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = run(buildRequest(cln.url, 'second'));
    const [resFirst, resSecond] = await Promise.all([first, second]);
    assert.equal(resFirst.statusCode, 200, JSON.stringify(resFirst.body));
    assert.equal(resSecond.statusCode, 200, JSON.stringify(resSecond.body));
    const decodes = (rune) => cln.seen.filter((r) => r.path === '/v1/decode' && r.rune === rune).length;
    assert.equal(decodes('first'), COUNT);
    assert.equal(decodes('second'), COUNT);
  } finally { await cln.close(); }
});

test('listPayments: an error while sending the list still answers the request', async () => {
  const cln = await startFakeCln();
  try {
    const out = { statusCode: null, body: null, headersSent: false, sends: 0 };
    const done = new Promise((resolve) => {
      out.status = (code) => { out.statusCode = code; return out; };
      out.json = (payload) => {
        out.sends++;
        if (out.sends === 1) { throw new Error('send failed'); }
        out.body = payload;
        resolve(out);
        return out;
      };
    });
    listPayments(buildRequest(cln.url), out, null);
    await Promise.race([done, new Promise((resolve) => setTimeout(resolve, 2000))]);
    assert.equal(out.sends, 2, 'no error response was sent');
    assert.equal(out.statusCode, 500);
    assert.equal(out.body.message, 'List Payments Error');
  } finally { await cln.close(); }
});

test('listPayments: a node with no payments answers an empty list', async () => {
  const cln = await startFakeCln(0);
  try {
    const res = await Promise.race([run(buildRequest(cln.url)), new Promise((resolve) => setTimeout(() => resolve({ statusCode: 'no response' }), 2000))]);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body, []);
    assert.deepEqual(cln.seen.map((r) => r.path), ['/v1/listsendpays']);
  } finally { await cln.close(); }
});

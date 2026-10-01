import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { decodePayment, getSentPaymentsInformation } from '../../backend/controllers/eclair/payments.js';

// getSentPaymentsInformation asks Eclair for the sent info of every payment hash in the list.
// It started all the calls at once, through a helper that wrote to the controller's shared
// options object. The calls now run at most 20 at a time, each with a copy of the request's
// own options.

// A fake Eclair that answers after a short delay, so calls overlap and can be counted.
const startFakeEclair = async () => {
  const seen = [];
  const load = { inFlight: 0, max: 0 };
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const form = Object.fromEntries(new URLSearchParams(raw));
      seen.push({ path: req.url, form, authorization: req.headers.authorization });
      load.inFlight++;
      load.max = Math.max(load.max, load.inFlight);
      setTimeout(() => {
        load.inFlight--;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(req.url === '/getsentinfo' ? [{ paymentHash: form.paymentHash, amount: 2000, status: { type: 'sent' } }] : {}));
      }, 20);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, load, close: () => new Promise((resolve) => server.close(resolve)) };
};

const basic = (password) => 'Basic ' + Buffer.from(':' + password).toString('base64');

const buildRequest = (url, { body = {}, params = {}, password = 'pw' } = {}) => ({
  session: {
    selectedNode: {
      index: 1, lnNode: 'eclair-node', lnImplementation: 'ECL',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { authorization: basic(password) } } },
      settings: { lnServerUrl: url, logLevel: 'ERROR' }
    }
  },
  query: {},
  params,
  body
});

const run = (handler, req) => new Promise((resolve) => {
  const out = { statusCode: null, body: null };
  out.status = (code) => { out.statusCode = code; return out; };
  out.json = (payload) => { out.body = payload; resolve(out); return out; };
  handler(req, out, null);
});

const HASHES = Array.from({ length: 60 }, (_, i) => i.toString(16).padStart(64, '0'));

test('getSentPaymentsInformation: a long list is fetched at most 20 at a time and keeps its order', async () => {
  const eclair = await startFakeEclair();
  try {
    const res = await run(getSentPaymentsInformation, buildRequest(eclair.url, { body: { payments: HASHES.join(',') } }));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.map((v) => v[0].paymentHash), HASHES);
    assert.equal(res.body[0][0].amount, 2);
    assert.equal(eclair.seen.length, HASHES.length);
    assert.ok(eclair.load.max <= 20, `${eclair.load.max} calls in flight`);
    assert.ok(eclair.load.max > 1, 'calls no longer overlap');
  } finally { await eclair.close(); }
});

test('getSentPaymentsInformation: a list still being fetched keeps its own credentials when another session makes a request', async () => {
  const eclair = await startFakeEclair();
  try {
    const list = run(getSentPaymentsInformation, buildRequest(eclair.url, { body: { payments: HASHES.join(',') }, password: 'first' }));
    await new Promise((resolve) => setTimeout(resolve, 30));
    await run(decodePayment, buildRequest(eclair.url, { params: { invoice: 'lnbcrt1other' }, password: 'second' }));
    const res = await list;
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const byPassword = (p) => eclair.seen.filter((r) => r.authorization === basic(p)).map((r) => r.path);
    assert.deepEqual(byPassword('second'), ['/parseinvoice']);
    assert.equal(byPassword('first').length, HASHES.length);
    assert.deepEqual(res.body.map((v) => v[0].paymentHash), HASHES);
  } finally { await eclair.close(); }
});

test('getSentPaymentsInformation: an error while sending the list still answers the request', async () => {
  const eclair = await startFakeEclair();
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
    getSentPaymentsInformation(buildRequest(eclair.url, { body: { payments: HASHES[0] } }), out, null);
    await Promise.race([done, new Promise((resolve) => setTimeout(resolve, 500))]);
    assert.equal(out.sends, 2, 'no error response was sent');
    assert.equal(out.statusCode, 500);
    assert.equal(out.body.message, 'Sent Payment Error');
  } finally { await eclair.close(); }
});

test('getSentPaymentsInformation: a payments value that is not a string is refused with 400', async () => {
  const eclair = await startFakeEclair();
  try {
    const res = await run(getSentPaymentsInformation, buildRequest(eclair.url, { body: { payments: [HASHES[0]] } }));
    assert.equal(res.statusCode, 400, JSON.stringify(res.body));
    assert.equal(eclair.seen.length, 0);
  } finally { await eclair.close(); }
});

test('getSentPaymentsInformation: no payments still answers an empty list', async () => {
  const eclair = await startFakeEclair();
  try {
    const res = await run(getSentPaymentsInformation, buildRequest(eclair.url));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, []);
    assert.equal(eclair.seen.length, 0);
  } finally { await eclair.close(); }
});

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { postPayment } from '../../backend/controllers/cln/payments.js';

const OFFER_ID = 'a'.repeat(64);
const OTHER_OFFER_ID = 'b'.repeat(64);
const bolt12Offer = (offerId = OFFER_ID) => ({ type: 'bolt12 offer', valid: true, offer_id: offerId });

// A fake clnrest: /v1/decode answers an lno1 string with the given decoded offer and anything
// else with the given decoded invoice; /v1/pay succeeds.
const startFakeCln = async (decoded, decodedOffer = bolt12Offer()) => {
  const seen = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      seen.push({ path: req.url, body: raw ? JSON.parse(raw) : null });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (req.url === '/v1/decode') {
        const string = raw ? JSON.parse(raw).string : '';
        res.end(JSON.stringify(String(string).startsWith('lno1') ? decodedOffer : decoded));
      } else {
        res.end(JSON.stringify({ status: 'complete', amount_msat: decoded.invoice_amount_msat }));
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    seen,
    paid: () => seen.some((call) => call.path === '/v1/pay'),
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

const buildRequest = (cln, body) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'test-node',
      lnImplementation: 'CLN',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { rune: 'test-rune' } } },
      settings: { lnServerUrl: cln.url, logLevel: 'ERROR' }
    }
  },
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

const offerBody = (amountMsat) => ({
  paymentType: 'OFFER', bolt11: 'lni1testinvoice', bolt12: 'lno1testoffer', amount_msat: amountMsat,
  saveToDB: false, zeroAmtOffer: false, title: '', fromDialog: true
});

const bolt12Invoice = (amountMsat, offerId = OFFER_ID) => ({ type: 'bolt12 invoice', valid: true, offer_id: offerId, invoice_amount_msat: amountMsat });

test('postPayment OFFER: refuses to pay an invoice for more than the form amount', async () => {
  const cln = await startFakeCln(bolt12Invoice(5000000));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /amount/i);
    assert.equal(cln.paid(), false, 'the invoice must not be paid');
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses to pay an invoice for less than the form amount', async () => {
  const cln = await startFakeCln(bolt12Invoice(999000));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses when no expected amount is sent', async () => {
  const cln = await startFakeCln(bolt12Invoice(1000000));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(undefined)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses when the invoice carries no amount', async () => {
  const cln = await startFakeCln({ type: 'bolt12 invoice', valid: true });
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses a string that is not a bolt12 invoice', async () => {
  const cln = await startFakeCln({ type: 'bolt11 invoice', valid: true, amount_msat: 1000000 });
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: pays when the invoice amount matches the form amount', async () => {
  const cln = await startFakeCln(bolt12Invoice(1000000));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 201);
    const decoded = cln.seen.filter((call) => call.path === '/v1/decode').map((call) => call.body.string).sort();
    assert.deepEqual(decoded, ['lni1testinvoice', 'lno1testoffer']);
    const pay = cln.seen.find((call) => call.path === '/v1/pay');
    assert.ok(pay, 'the invoice should be paid');
    assert.equal(pay.body.bolt11, 'lni1testinvoice');
    assert.equal(pay.body.amount_msat, undefined, 'pay must use the invoice amount, not a caller-supplied one');
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: a urlencoded (string) form amount still matches', async () => {
  const cln = await startFakeCln(bolt12Invoice(1000000));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody('1000000')), res, null);
    await res.done;

    assert.equal(res.statusCode, 201);
    assert.ok(cln.paid());
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: an amount that is not a whole number of sats still matches', async () => {
  // 1001 msat shown as 1.001 sats and multiplied back by 1000 arrives as 1000.9999999999999.
  const cln = await startFakeCln(bolt12Invoice(1001));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1001 / 1000 * 1000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 201);
    assert.ok(cln.paid());
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses an invoice issued for a different offer', async () => {
  const cln = await startFakeCln(bolt12Invoice(1000000, OTHER_OFFER_ID));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /offer/i);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses an invoice that names no offer', async () => {
  const cln = await startFakeCln({ type: 'bolt12 invoice', valid: true, invoice_amount_msat: 1000000 });
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses when the offer is missing', async () => {
  const cln = await startFakeCln(bolt12Invoice(1000000));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, { ...offerBody(1000000), bolt12: undefined }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment OFFER: refuses when the offer string is not a bolt12 offer', async () => {
  const cln = await startFakeCln(bolt12Invoice(1000000), { type: 'bolt11 invoice', valid: true });
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, offerBody(1000000)), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(cln.paid(), false);
  } finally {
    await cln.close();
  }
});

test('postPayment INVOICE: bolt11 payments are not decoded first', async () => {
  const cln = await startFakeCln(bolt12Invoice(1000000));
  try {
    const res = buildResponse();
    postPayment(buildRequest(cln, { paymentType: 'INVOICE', bolt11: 'lnbcrt1test', fromDialog: true }), res, null);
    await res.done;

    assert.equal(res.statusCode, 201);
    assert.deepEqual(cln.seen.map((call) => call.path), ['/v1/pay']);
  } finally {
    await cln.close();
  }
});

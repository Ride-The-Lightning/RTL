import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { sendPayment } from '../../backend/controllers/lnd/payments.js';

const PAY_REQ = 'lnbcrt100u1testinvoice';
const DEST = '0323ce56abc0fec923dd89b443f5e8a17b0bd7b64000ab703859d49d9b879e6a23';

// A fake LND: the payment fails with the given reason, the invoice decodes to `decoded`, and the
// route query answers with a route costing `routeFeeSat`, or with an error when `routesStatus` isn't 200.
const startFakeLnd = async ({ failureReason = 'FAILURE_REASON_NO_ROUTE', decoded = {}, routeFeeSat = '500000', routesStatus = 200 } = {}) => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push(req.method + ' ' + req.url);
    if (req.url === '/v2/router/send') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ result: { status: 'IN_FLIGHT' } }) + '\n' + JSON.stringify({ result: { status: 'FAILED', failure_reason: failureReason } }) + '\n');
    } else if (req.url.startsWith('/v1/payreq/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ destination: DEST, num_satoshis: '10000', cltv_expiry: '80', route_hints: [], ...decoded }));
    } else if (req.url.startsWith('/v1/graph/routes/')) {
      res.writeHead(routesStatus, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(routesStatus === 200 ? { routes: [{ total_fees: routeFeeSat, hops: [{}, {}] }] } : { code: 2, message: 'unable to find a path to destination' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (lnd, body) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'test-node',
      lnImplementation: 'LND',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': 'mac' } } },
      settings: { lnServerUrl: lnd.url, logLevel: 'ERROR' }
    }
  },
  body
});

const buildResponse = () => {
  const out = { statusCode: null, body: null, headersSent: false };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; out.headersSent = true; resolve(payload); return out; };
  });
  return out;
};

const send = async (lnd, body) => {
  const res = buildResponse();
  sendPayment(buildRequest(lnd, body), res, null);
  await res.done;
  return res;
};

test('sendPayment: a no-route failure under a fee limit reports what the cheapest route costs', async () => {
  const lnd = await startFakeLnd();
  try {
    const res = await send(lnd, { payment_request: PAY_REQ, amp: false, fee_limit_sat: 500 });
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error.trim(), 'No Route');
    assert.equal(res.body.cheapest_route_fee_sat, 500000);
    const query = lnd.seen.find((line) => line.startsWith('GET /v1/graph/routes/'));
    assert.equal(query, 'GET /v1/graph/routes/' + DEST + '/10000?fee_limit.fixed=2100000000000000&final_cltv_delta=80');
  } finally {
    await lnd.close();
  }
});

test('sendPayment: a zero amount invoice is looked up for the amount being paid', async () => {
  const lnd = await startFakeLnd({ decoded: { num_satoshis: '0' } });
  try {
    const res = await send(lnd, { payment_request: PAY_REQ, amp: false, amt: 2000, fee_limit_sat: 100 });
    assert.equal(res.body.cheapest_route_fee_sat, 500000);
    assert.ok(lnd.seen.some((line) => line.startsWith('GET /v1/graph/routes/' + DEST + '/2000?')));
  } finally {
    await lnd.close();
  }
});

test('sendPayment: no route cost for an invoice with route hints, which the route query cannot take', async () => {
  const lnd = await startFakeLnd({ decoded: { route_hints: [{ hop_hints: [{ node_id: DEST, chan_id: '1', fee_base_msat: 1000 }] }] } });
  try {
    const res = await send(lnd, { payment_request: PAY_REQ, amp: false, fee_limit_sat: 500 });
    assert.equal(res.body.error.trim(), 'No Route');
    assert.equal(res.body.cheapest_route_fee_sat, undefined);
    assert.ok(!lnd.seen.some((line) => line.startsWith('GET /v1/graph/routes/')));
  } finally {
    await lnd.close();
  }
});

test('sendPayment: no route cost for a payment pinned to an outgoing channel or last hop, which the route query would ignore', async () => {
  for (const pin of [{ outgoing_chan_ids: ['123456789'] }, { last_hop_pubkey: DEST }]) {
    const lnd = await startFakeLnd();
    try {
      const res = await send(lnd, { payment_request: PAY_REQ, amp: false, fee_limit_sat: 500, ...pin });
      assert.equal(res.body.error.trim(), 'No Route');
      assert.equal(res.body.cheapest_route_fee_sat, undefined);
      assert.ok(!lnd.seen.some((line) => line.startsWith('GET /v1/graph/routes/')));
    } finally {
      await lnd.close();
    }
  }
});

test('sendPayment: a failed route query still answers with the No Route failure', async () => {
  const lnd = await startFakeLnd({ routesStatus: 500 });
  try {
    const res = await send(lnd, { payment_request: PAY_REQ, amp: false, fee_limit_sat: 500 });
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error.trim(), 'No Route');
    assert.equal(res.body.cheapest_route_fee_sat, undefined);
    assert.ok(lnd.seen.some((line) => line.startsWith('GET /v1/graph/routes/')));
  } finally {
    await lnd.close();
  }
});

test('sendPayment: no route cost when the cheapest route is within the limit, so the limit was not the reason', async () => {
  const lnd = await startFakeLnd({ routeFeeSat: '300' });
  try {
    const res = await send(lnd, { payment_request: PAY_REQ, amp: false, fee_limit_sat: 500 });
    assert.equal(res.body.error.trim(), 'No Route');
    assert.equal(res.body.cheapest_route_fee_sat, undefined);
  } finally {
    await lnd.close();
  }
});

test('sendPayment: no lookup without a fee limit or for other failures', async () => {
  for (const [options, body] of [[{}, { payment_request: PAY_REQ, amp: false }], [{ failureReason: 'FAILURE_REASON_INSUFFICIENT_BALANCE' }, { payment_request: PAY_REQ, amp: false, fee_limit_sat: 500 }]]) {
    const lnd = await startFakeLnd(options);
    try {
      const res = await send(lnd, body);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.cheapest_route_fee_sat, undefined);
      assert.deepEqual(lnd.seen, ['POST /v2/router/send']);
    } finally {
      await lnd.close();
    }
  }
});

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { circularRebalance } from '../../backend/controllers/eclair/channels.js';
import { sendPaymentToRoute } from '../../backend/controllers/eclair/payments.js';

const SOURCE_NODE = '033c6f0fb82e995e05c95b84d0243d3d605575427f96f13268a6356d92a2cf4613';
const TARGET_NODE = '0323ce56abc0fec923dd89b443f5e8a17b0bd7b64000ab703859d49d9b879e6a23';
const FEE_CAP_FAILURE = {
  type: 'failed',
  failures: [{ failureType: 'Local', failureMessage: 'Route fee (20001050 msat) was above the maximum allowed fee (1500000 msat) for route 1x1x0->2x1x0->3x1x0', failedRoute: [] }]
};

// A fake Eclair that records the form of every call. The route lookup answers with `routes`, or
// fails when `routesStatus` isn't 200; getsentinfo answers with a payment whose status is `sentStatus`.
const startFakeEclair = async ({ routes = [{ amount: 30000000, shortChannelIds: ['2x1x0'] }], routesStatus = 200, sentStatus = { type: 'sent', feesPaid: 1050 } } = {}) => {
  const calls = [];
  const server = createServer((req, res) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      calls.push({ path: req.url, form: Object.fromEntries(new URLSearchParams(data)) });
      const reply = (status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(payload)); };
      switch (req.url) {
        case '/listpendinginvoices': return reply(200, []);
        case '/findroutebetweennodes': return routesStatus === 200 ? reply(200, { routes }) : reply(routesStatus, { error: 'route not found' });
        case '/createinvoice': return reply(200, { serialized: 'lnbcrt300u1rebalance', paymentHash: 'ab'.repeat(32) });
        case '/sendtoroute': return reply(200, { paymentId: 'pid', parentId: 'ppid' });
        case '/getsentinfo': return reply(200, [{ id: 'pid', amount: 30000000, status: sentStatus }]);
        default: return reply(404, {});
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    calls,
    formOf: (path) => calls.find((call) => call.path === path)?.form,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

const buildRequest = (eclair, body) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'eclair-node',
      lnImplementation: 'ECL',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { authorization: 'Basic ' + Buffer.from(':pw').toString('base64') } } },
      settings: { lnServerUrl: eclair.url, logLevel: 'ERROR' }
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

// The controller answers after Eclair's payment status is in, which it waits 3 seconds for.
const call = async (handler, eclair, body) => {
  const res = buildResponse();
  handler(buildRequest(eclair, body), res, null);
  const answered = await Promise.race([res.done.then(() => true), new Promise((resolve) => setTimeout(() => resolve(false), 6000))]);
  assert.ok(answered, 'the controller never answered');
  return res;
};

const rebalanceBody = (extra = {}) => ({
  amountMsat: 30000000, sourceShortChannelId: '1x1x0', sourceNodeId: SOURCE_NODE, targetShortChannelId: '3x1x0', targetNodeId: TARGET_NODE,
  ignoreNodeIds: ['02a708c869d60b02d596d310b7def6fe6a955f1af75e3c2c60a6407d3879d844fb'], format: 'shortChannelId', ...extra
});

test('circularRebalance asks Eclair to refuse a route costing more than the max fee', async () => {
  const eclair = await startFakeEclair();
  try {
    const res = await call(circularRebalance, eclair, rebalanceBody({ maxFeeMsat: 2000000 }));
    assert.equal(res.statusCode, 201);
    assert.deepEqual(eclair.formOf('/sendtoroute'), { shortChannelIds: '1x1x0,2x1x0,3x1x0', amountMsat: '30000000', invoice: 'lnbcrt300u1rebalance', maxFeeMsat: '2000000' });
  } finally {
    await eclair.close();
  }
});

test('circularRebalance without a max fee caps the route at the default limit', async () => {
  const eclair = await startFakeEclair();
  try {
    await call(circularRebalance, eclair, rebalanceBody());
    // 5% of 30,000 sats.
    assert.equal(eclair.formOf('/sendtoroute').maxFeeMsat, '1500000');
  } finally {
    await eclair.close();
  }
});

test('circularRebalance reports a payment Eclair failed as an error, with what the route would have cost', async () => {
  const eclair = await startFakeEclair({ sentStatus: FEE_CAP_FAILURE });
  try {
    const res = await call(circularRebalance, eclair, rebalanceBody({ maxFeeMsat: 1500000 }));
    const error = res.body.paymentStatus.error;
    assert.ok(error, 'a failed payment must carry an error, or the dialog reports success');
    assert.match(error, /Nothing was paid/);
    assert.match(error, /20,001\.05 Sats/);
    assert.match(error, /1,500 Sats/);
  } finally {
    await eclair.close();
  }
});

test('circularRebalance passes on the reason of any other failed payment', async () => {
  const eclair = await startFakeEclair({ sentStatus: { type: 'failed', failures: [{ failureType: 'Remote', failureMessage: 'TemporaryChannelFailure' }] } });
  try {
    const res = await call(circularRebalance, eclair, rebalanceBody({ maxFeeMsat: 1500000 }));
    assert.match(res.body.paymentStatus.error, /TemporaryChannelFailure/);
  } finally {
    await eclair.close();
  }
});

test('circularRebalance answers when the route lookup fails and there is no invoice to reuse', async () => {
  const eclair = await startFakeEclair({ routesStatus: 400 });
  try {
    const res = await call(circularRebalance, eclair, rebalanceBody());
    assert.ok(res.statusCode >= 400);
    assert.equal(res.body.invoice, '');
    assert.ok(res.body.paymentStatus.error);
    assert.equal(eclair.formOf('/sendtoroute'), undefined);
  } finally {
    await eclair.close();
  }
});

test('circularRebalance says so when the only route found is the direct pair of channels it filters out', async () => {
  const eclair = await startFakeEclair({ routes: [{ amount: 30000000, shortChannelIds: ['1x1x0', '3x1x0'] }] });
  try {
    const res = await call(circularRebalance, eclair, rebalanceBody());
    assert.ok(res.statusCode >= 400);
    assert.match(res.body.paymentStatus.error, /No route found/);
    assert.equal(eclair.formOf('/sendtoroute'), undefined);
  } finally {
    await eclair.close();
  }
});

for (const maxFeeMsat of [-1, 'abc', 1.5]) {
  test(`circularRebalance rejects a max fee of ${JSON.stringify(maxFeeMsat)} without paying`, async () => {
    const eclair = await startFakeEclair();
    try {
      const res = await call(circularRebalance, eclair, rebalanceBody({ maxFeeMsat }));
      assert.equal(res.statusCode, 400);
      assert.equal(eclair.formOf('/sendtoroute'), undefined);
    } finally {
      await eclair.close();
    }
  });
}

test('sendPaymentToRoute forwards the max fee it is given', async () => {
  const eclair = await startFakeEclair();
  try {
    await call(sendPaymentToRoute, eclair, { shortChannelIds: '1x1x0,2x1x0', invoice: 'lnbcrt1', amountMsat: 30000000, maxFeeMsat: 7000 });
    assert.equal(eclair.formOf('/sendtoroute').maxFeeMsat, '7000');
  } finally {
    await eclair.close();
  }
});

test('sendPaymentToRoute without a max fee caps the route at the default limit', async () => {
  const eclair = await startFakeEclair();
  try {
    // Up to 100 sats the default is the whole amount; above that, 5% of it.
    await call(sendPaymentToRoute, eclair, { shortChannelIds: '1x1x0,2x1x0', invoice: 'lnbcrt1', amountMsat: 100000 });
    assert.equal(eclair.formOf('/sendtoroute').maxFeeMsat, '100000');
    eclair.calls.length = 0;
    await call(sendPaymentToRoute, eclair, { shortChannelIds: '1x1x0,2x1x0', invoice: 'lnbcrt1', amountMsat: 100001 });
    assert.equal(eclair.formOf('/sendtoroute').maxFeeMsat, '5001');
  } finally {
    await eclair.close();
  }
});

test('sendPaymentToRoute rejects a negative max fee without paying', async () => {
  const eclair = await startFakeEclair();
  try {
    const res = await call(sendPaymentToRoute, eclair, { shortChannelIds: '1x1x0,2x1x0', invoice: 'lnbcrt1', amountMsat: 30000000, maxFeeMsat: -5 });
    assert.equal(res.statusCode, 400);
    assert.equal(eclair.formOf('/sendtoroute'), undefined);
  } finally {
    await eclair.close();
  }
});

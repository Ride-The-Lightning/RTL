import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import express from 'express';

import { getFees, getPayments } from '../../backend/controllers/eclair/fees.js';
import eclChannelsRoutes from '../../backend/routes/eclair/channels.js';

// Eclair 0.14 reworked its AuditDb and changed the shape of every /audit entry (issue #1735):
// - sent parts: amount/feesPaid/toChannelId/timestamp became amountWithFees/fees/channelId/
//   startedAt+settledAt, where 0.13's amount excluded fees (amountWithFees = amount + feesPaid);
// - received parts: fromChannelId/timestamp became channelId/receivedAt;
// - payment-relayed: amountIn/amountOut/fromChannelId/toChannelId/settledAt became
//   incoming[]/outgoing[] lists, each part with its own channelId, amount and timestamp.
// RTL read 0.13's fields, so getPayments threw on part.timestamp.unix (HTTP 500) and getFees
// summed undefined amounts into NaN. Both versions must give the same RTL-side output.

const nowSec = Math.round(Date.now() / 1000);
const ts = (unix) => ({ iso: new Date(unix * 1000).toISOString(), unix });
const CH_A = '52b024484354cd8d7dbdc26eb0d86a67d33f030adc949810d6fb3ad695bda7ab';
const CH_B = '4e00c5e2d4968dbabe9996c8da0b10d97716b6059bbff8048b1fc901f04dcecb';
const NODE = '02050846a1b5656f24a4580752f479175f1745d857c8353a0493ef07e0173b6ad8';

// Shape as returned by Eclair 0.13.1 (PaymentEvents.scala at v0.13.1).
const AUDIT_V13 = {
  sent: [{
    type: 'payment-sent', id: 's1', paymentHash: 'aa'.repeat(32), paymentPreimage: 'bb'.repeat(32),
    recipientAmount: 8000000, recipientNodeId: NODE,
    parts: [{ id: 'p1', amount: 8000000, feesPaid: 1000, toChannelId: CH_A, timestamp: ts(nowSec - 60) }]
  }],
  received: [{
    type: 'payment-received', paymentHash: 'cc'.repeat(32),
    parts: [{ amount: 30000000, fromChannelId: CH_A, timestamp: ts(nowSec - 120) }]
  }],
  relayed: [{
    type: 'payment-relayed', paymentHash: 'dd'.repeat(32), amountIn: 50011000, amountOut: 50000000,
    fromChannelId: CH_A, toChannelId: CH_B, receivedAt: ts(nowSec - 30), settledAt: ts(nowSec - 30)
  }]
};

// Shape as returned by Eclair 0.14.2, taken from the regtest fixture (fees made non-zero).
const AUDIT_V14 = {
  sent: [{
    type: 'payment-sent', id: 's1', paymentHash: 'aa'.repeat(32), paymentPreimage: 'bb'.repeat(32),
    recipientAmount: 8000000, recipientNodeId: NODE,
    parts: [{ id: 'p1', channelId: CH_A, nextNodeId: NODE, amountWithFees: 8001000, fees: 1000, startedAt: ts(nowSec - 61), settledAt: ts(nowSec - 60) }],
    fees: 1000, startedAt: ts(nowSec - 61), settledAt: ts(nowSec - 60)
  }],
  received: [{
    type: 'payment-received', paymentHash: 'cc'.repeat(32),
    parts: [{ channelId: CH_A, remoteNodeId: NODE, amount: 30000000, receivedAt: ts(nowSec - 120) }]
  }],
  relayed: [{
    type: 'payment-relayed', paymentHash: 'dd'.repeat(32),
    incoming: [{ channelId: CH_A, remoteNodeId: NODE, amount: 50011000, receivedAt: ts(nowSec - 31) }],
    outgoing: [{ channelId: CH_B, remoteNodeId: NODE, amount: 50000000, settledAt: ts(nowSec - 30) }]
  }]
};

const startFakeEclair = async (audit) => {
  const server = createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(req.url === '/audit' ? audit : {}));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (url) => ({
  session: {
    selectedNode: {
      index: 1, lnNode: 'eclair-node', lnImplementation: 'ECL',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { authorization: 'Basic Onx3' } } },
      settings: { lnServerUrl: url, logLevel: 'ERROR' }
    }
  },
  query: {},
  params: {},
  body: {}
});

const run = (handler, req) => new Promise((resolve) => {
  const out = { statusCode: null, body: null };
  out.status = (code) => { out.statusCode = code; return out; };
  out.json = (payload) => { out.body = payload; resolve(out); return out; };
  handler(req, out, null);
});

const fetchFrom = async (handler, audit) => {
  const eclair = await startFakeEclair(audit);
  try {
    return await run(handler, buildRequest(eclair.url));
  } finally { await eclair.close(); }
};

for (const [version, audit] of [['0.13', AUDIT_V13], ['0.14', AUDIT_V14]]) {
  test(`getPayments: Eclair ${version} audit is arranged into RTL's payment shape`, async () => {
    const res = await fetchFrom(getPayments, structuredClone(audit));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const [sent] = res.body.sent;
    assert.equal(sent.recipientAmount, 8000);
    assert.deepEqual(
      { amount: sent.parts[0].amount, feesPaid: sent.parts[0].feesPaid, toChannelId: sent.parts[0].toChannelId, timestamp: sent.parts[0].timestamp },
      { amount: 8000, feesPaid: 1, toChannelId: CH_A, timestamp: (nowSec - 60) * 1000 }
    );
    assert.equal(sent.firstPartTimestamp, (nowSec - 60) * 1000);
    const [received] = res.body.received;
    assert.deepEqual(
      { amount: received.parts[0].amount, fromChannelId: received.parts[0].fromChannelId, timestamp: received.parts[0].timestamp },
      { amount: 30000, fromChannelId: CH_A, timestamp: (nowSec - 120) * 1000 }
    );
    assert.equal(received.firstPartTimestamp, (nowSec - 120) * 1000);
    const [relayed] = res.body.relayed;
    assert.deepEqual(
      { type: relayed.type, amountIn: relayed.amountIn, amountOut: relayed.amountOut, fromChannelId: relayed.fromChannelId, toChannelId: relayed.toChannelId, timestamp: relayed.timestamp },
      { type: 'payment-relayed', amountIn: 50011, amountOut: 50000, fromChannelId: CH_A, toChannelId: CH_B, timestamp: (nowSec - 30) * 1000 }
    );
  });

  test(`getFees: Eclair ${version} relays are counted with their fee`, async () => {
    const res = await fetchFrom(getFees, structuredClone(audit));
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body, { daily_fee: 11, daily_txs: 1, weekly_fee: 11, weekly_txs: 1, monthly_fee: 11, monthly_txs: 1 });
  });
}

// A relay split over several channels has no single from/to channel; its parts stay listed.
test('getPayments: an Eclair 0.14 relay over several channels keeps every part', async () => {
  const audit = structuredClone(AUDIT_V14);
  audit.relayed[0].outgoing.push({ channelId: CH_A, remoteNodeId: NODE, amount: 1000, settledAt: ts(nowSec - 20) });
  const res = await fetchFrom(getPayments, audit);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  const [relayed] = res.body.relayed;
  assert.equal(relayed.amountOut, 50001);
  assert.deepEqual(relayed.outgoing.map((part) => part.channelId), [CH_B, CH_A]);
  assert.equal(relayed.timestamp, (nowSec - 20) * 1000);
});

// Eclair 0.14 removed /channelstats; RTL's route to it had no frontend caller and is gone.
test('GET /api/ecl/channels/stats is no longer routed', async () => {
  const app = express();
  app.use((req, res, next) => { req.session = {}; next(); });
  app.use('/api/ecl/channels', eclChannelsRoutes);
  app.use((req, res) => res.status(404).json({ message: 'not routed' }));
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const res = await fetch('http://127.0.0.1:' + server.address().port + '/api/ecl/channels/stats');
    assert.deepEqual({ status: res.status, body: await res.json() }, { status: 404, body: { message: 'not routed' } });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

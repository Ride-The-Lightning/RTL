import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { listInvoices } from '../../backend/controllers/eclair/invoices.js';

// Eclair's listinvoices returns invoices oldest-first, paginated with count/skip, and never
// reports how many there are in total. RTL used to work around that by asking for a million
// rows and then calling /getreceivedinfo once per invoice, which is what pinned a node with
// hundreds of thousands of invoices at 100% CPU (issue #1067). These tests pin the replacement
// contract: every upstream call is bounded, the total is derived, and pages come back
// newest-first.

const makeInvoice = (i) => ({
  prefix: 'lnbcrt',
  timestamp: 1700000000 + i,
  nodeId: '02' + 'ab'.repeat(32),
  serialized: 'lnbcrt1invoice' + i,
  description: 'invoice ' + i,
  paymentHash: i.toString(16).padStart(64, '0'),
  expiry: 3600,
  amount: (i + 1) * 1000,
  features: { activated: [], unknown: [] }
});

// The fake node holds `total` invoices in creation order and answers the three endpoints the
// controller may hit. It records every call so the tests can assert on what was asked of it.
const startFakeEclair = async (total, statusByHash = {}) => {
  const all = Array.from({ length: total }, (_, i) => makeInvoice(i));
  const seen = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      const form = Object.fromEntries(new URLSearchParams(raw));
      seen.push({ path: req.url, form });
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/listinvoices') {
        const skip = form.skip !== undefined ? Number(form.skip) : 0;
        const count = form.count !== undefined ? Number(form.count) : all.length;
        res.end(JSON.stringify(all.slice(skip, skip + count)));
      } else if (req.url === '/getreceivedinfo') {
        const status = statusByHash[form.paymentHash] || { type: 'pending' };
        res.end(JSON.stringify({ paymentHash: form.paymentHash, status }));
      } else if (req.url === '/listpendinginvoices') {
        res.end(JSON.stringify(all));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: 'http://127.0.0.1:' + port, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (node, query) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'eclair-node',
      lnImplementation: 'ECL',
      authentication: {
        options: {
          url: '',
          rejectUnauthorized: false,
          json: true,
          headers: { authorization: 'Basic ' + Buffer.from(':pw').toString('base64') }
        }
      },
      settings: { lnServerUrl: node.url, logLevel: 'ERROR' }
    }
  },
  query
});

const invoke = (node, query) => new Promise((resolve) => {
  const out = { statusCode: null, body: null };
  const res = {
    status: (code) => { out.statusCode = code; return res; },
    json: (payload) => { out.body = payload; resolve(out); return res; }
  };
  listInvoices(buildRequest(node, query), res, () => { });
});

const listCalls = (node) => node.seen.filter((call) => call.path === '/listinvoices');
const receivedInfoCalls = (node) => node.seen.filter((call) => call.path === '/getreceivedinfo');

test('listInvoices returns the newest page first with the derived total', async () => {
  const node = await startFakeEclair(57);
  try {
    const res = await invoke(node, { count: '10', skip: '0' });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.totalInvoices, 57);
    assert.equal(res.body.invoices.length, 10);
    assert.deepEqual(res.body.invoices.map((inv) => inv.description), Array.from({ length: 10 }, (_, i) => 'invoice ' + (56 - i)));
    // Per-invoice fields the UI relies on are still derived.
    assert.equal(res.body.invoices[0].expiresAt, 1700000000 + 56 + 3600);
    assert.equal(res.body.invoices[0].amount, 57);
  } finally {
    await node.close();
  }
});

test('listInvoices pages through skip in newest-first order and handles the ragged last page', async () => {
  const node = await startFakeEclair(57);
  try {
    const second = await invoke(node, { count: '25', skip: '25' });
    assert.equal(second.statusCode, 200, JSON.stringify(second.body));
    assert.deepEqual(second.body.invoices.map((inv) => inv.description), Array.from({ length: 25 }, (_, i) => 'invoice ' + (31 - i)));
    const last = await invoke(node, { count: '25', skip: '50' });
    assert.equal(last.body.invoices.length, 7);
    assert.deepEqual(last.body.invoices.map((inv) => inv.description), Array.from({ length: 7 }, (_, i) => 'invoice ' + (6 - i)));
    const beyond = await invoke(node, { count: '25', skip: '75' });
    assert.equal(beyond.statusCode, 200);
    assert.deepEqual(beyond.body, { invoices: [], totalInvoices: 57 });
  } finally {
    await node.close();
  }
});

test('listInvoices never asks eclair for an unbounded list, even when the client sends no count', async () => {
  const node = await startFakeEclair(1500);
  try {
    const res = await invoke(node, {});
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.totalInvoices, 1500);
    assert.ok(res.body.invoices.length > 0 && res.body.invoices.length <= 100, 'default page must be bounded, got ' + res.body.invoices.length);
    assert.equal(res.body.invoices[0].description, 'invoice 1499');
    for (const call of listCalls(node)) {
      assert.ok(call.form.count !== undefined, 'every listinvoices call must carry a count: ' + JSON.stringify(call.form));
      assert.ok(Number(call.form.count) <= 100, 'listinvoices count must stay bounded: ' + call.form.count);
    }
    // Deriving the total costs O(log n) single-row probes, not a full scan.
    assert.ok(listCalls(node).length < 40, 'too many listinvoices calls: ' + listCalls(node).length);
    assert.equal(node.seen.filter((call) => call.path === '/listpendinginvoices').length, 0, 'the unbounded pending list must not be fetched');
  } finally {
    await node.close();
  }
});

test('listInvoices caps an oversized page size instead of forwarding it', async () => {
  const node = await startFakeEclair(300);
  try {
    const res = await invoke(node, { count: '1000000', skip: '0' });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.invoices.length, 100);
    assert.equal(res.body.totalInvoices, 300);
    for (const call of listCalls(node)) {
      assert.ok(Number(call.form.count) <= 100, 'listinvoices count must stay bounded: ' + call.form.count);
    }
  } finally {
    await node.close();
  }
});

test('listInvoices only resolves payment status for the invoices on the page', async () => {
  const paid = makeInvoice(999).paymentHash;
  const expired = makeInvoice(998).paymentHash;
  const node = await startFakeEclair(1000, {
    [paid]: { type: 'received', amount: 5000, receivedAt: { iso: '2024-01-01T00:00:00Z', unix: 1704067200 } },
    [expired]: { type: 'expired' }
  });
  try {
    const res = await invoke(node, { count: '5', skip: '0' });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(receivedInfoCalls(node).length, 5, 'one status lookup per invoice on the page');
    assert.deepEqual(res.body.invoices.map((inv) => inv.status), ['received', 'expired', 'unpaid', 'unpaid', 'unpaid']);
    assert.equal(res.body.invoices[0].amountSettled, 5);
    assert.equal(res.body.invoices[0].receivedAt, 1704067200);
  } finally {
    await node.close();
  }
});

test('listInvoices returns an empty page and zero total for a node with no invoices', async () => {
  const node = await startFakeEclair(0);
  try {
    const res = await invoke(node, { count: '10', skip: '0' });
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body, { invoices: [], totalInvoices: 0 });
    assert.equal(receivedInfoCalls(node).length, 0);
  } finally {
    await node.close();
  }
});

test('listInvoices rejects malformed paging parameters with a 400 and never calls eclair', async () => {
  const node = await startFakeEclair(5);
  try {
    for (const query of [{ count: 'ten' }, { count: '-1' }, { skip: '1.5' }, { count: '0x10' }, { skip: ['1', '2'] }]) {
      const res = await invoke(node, query);
      assert.equal(res.statusCode, 400, JSON.stringify(query) + ' -> ' + JSON.stringify(res.body));
      assert.ok(res.body.message && res.body.error, 'error envelope must carry message and error');
    }
    assert.equal(node.seen.length, 0);
  } finally {
    await node.close();
  }
});

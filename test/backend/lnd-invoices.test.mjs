import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { listInvoices } from '../../backend/controllers/lnd/invoices.js';

const startFakeLnd = async (macaroon, invoices) => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url, macaroon: req.headers['grpc-metadata-macaroon'] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ invoices }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    seen,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

const buildRequest = (node, query = {}) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'test-node',
      lnImplementation: 'LND',
      authentication: {
        options: {
          url: '',
          rejectUnauthorized: false,
          json: true,
          headers: { 'Grpc-Metadata-macaroon': node.macaroon }
        }
      },
      settings: { lnServerUrl: node.url, logLevel: 'ERROR' }
    }
  },
  query
});

const buildResponse = () => {
  const out = { statusCode: null, body: null, headersSent: false };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; out.headersSent = true; resolve(payload); return out; };
  });
  return out;
};

test('listInvoices: empty query uses default page size', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, '/v1/invoices?num_max_invoices=100');
  } finally {
    await lnd.close();
  }
});

test('listInvoices: zero num_max_invoices uses default', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { num_max_invoices: '0' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/invoices?num_max_invoices=100');
  } finally { await lnd.close(); }
});

test('listInvoices: valid params are forwarded correctly', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { num_max_invoices: '10', index_offset: '5', reversed: 'true' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, '/v1/invoices?num_max_invoices=10&index_offset=5&reversed=true');
  } finally {
    await lnd.close();
  }
});

test('listInvoices: invalid num_max_invoices returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { num_max_invoices: 'abc' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'num_max_invoices must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('listInvoices: invalid reversed returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { reversed: 'maybe' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'reversed must be a boolean');
  } finally {
    await lnd.close();
  }
});

test('listInvoices: empty string num_max_invoices returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { num_max_invoices: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'num_max_invoices must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('listInvoices: whitespace num_max_invoices returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { num_max_invoices: '   ' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'num_max_invoices must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('listInvoices: reversed 1 is coerced to true', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { reversed: '1' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/invoices?num_max_invoices=100&reversed=true');
  } finally { await lnd.close(); }
});

test('listInvoices: reversed 0 is coerced to false', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { reversed: '0' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/invoices?num_max_invoices=100&reversed=false');
  } finally { await lnd.close(); }
});

test('listInvoices: negative num_max_invoices returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { num_max_invoices: '-1' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
    assert.equal(res.body.message, 'num_max_invoices must be a non-negative integer');
  } finally { await lnd.close(); }
});

test('listInvoices: index_offset validation works', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { index_offset: 'abc' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
    assert.equal(res.body.message, 'index_offset must be a non-negative integer');
  } finally { await lnd.close(); }
});

test('listInvoices: oversized num_max_invoices returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    listInvoices(buildRequest(lnd, { num_max_invoices: '99999999999999999999' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
    assert.equal(res.body.message, 'num_max_invoices exceeds maximum safe integer');
  } finally { await lnd.close(); }
});
import { WSServer } from '../../backend/utils/webSocketServer.js';

test('cleanup websocket timer', () => {
  if (WSServer.pingInterval) {
    clearInterval(WSServer.pingInterval);
  }
});

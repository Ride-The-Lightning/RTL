import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { getPayments } from '../../backend/controllers/lnd/payments.js';

const startFakeLnd = async (macaroon, payments) => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url, macaroon: req.headers['grpc-metadata-macaroon'] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ payments }));
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

test('getPayments: empty query omits all params from upstream URL', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, '/v1/payments?max_payments=100');
  } finally {
    await lnd.close();
  }
});

test('getPayments: valid params are forwarded correctly', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { max_payments: '20', index_offset: '3', reversed: 'false' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, '/v1/payments?max_payments=20&index_offset=3&reversed=false');
  } finally {
    await lnd.close();
  }
});

test('getPayments: invalid max_payments returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { max_payments: 'not-a-number' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'max_payments must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('getPayments: invalid reversed returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { reversed: 'yes' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'reversed must be a boolean');
  } finally {
    await lnd.close();
  }
});

test('getPayments: empty string max_payments returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { max_payments: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'max_payments must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('getPayments: whitespace max_payments returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { max_payments: '   ' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'max_payments must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('getPayments: reversed 1 is coerced to true', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { reversed: '1' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/payments?max_payments=100&reversed=true');
  } finally { await lnd.close(); }
});

test('getPayments: reversed 0 is coerced to false', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { reversed: '0' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/payments?max_payments=100&reversed=false');
  } finally { await lnd.close(); }
});

test('getPayments: negative max_payments returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { max_payments: '-1' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
    assert.equal(res.body.message, 'max_payments must be a non-negative integer');
  } finally { await lnd.close(); }
});

test('getPayments: index_offset validation works', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { index_offset: 'abc' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
    assert.equal(res.body.message, 'index_offset must be a non-negative integer');
  } finally { await lnd.close(); }
});

test('getPayments: oversized max_payments returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, { max_payments: '99999999999999999999' }), res, null);
    await res.done;
    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
    assert.equal(res.body.message, 'max_payments exceeds maximum safe integer');
  } finally { await lnd.close(); }
});

test('getPayments: absent max_payments uses default', async () => {
  const lnd = await startFakeLnd('macaroon-test', []);
  try {
    const res = buildResponse();
    getPayments(buildRequest(lnd, {}), res, null);
    await res.done;
    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/payments?max_payments=100');
  } finally { await lnd.close(); }
});
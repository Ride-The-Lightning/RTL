import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { invoiceLookup } from '../../backend/controllers/lnd/invoices.js';

const startFakeLnd = async (macaroon, body = {}) => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url, macaroon: req.headers['grpc-metadata-macaroon'] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
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

test('invoiceLookup: empty query returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    invoiceLookup(buildRequest(lnd, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'payment_addr or payment_hash is required');
  } finally {
    await lnd.close();
  }
});

test('invoiceLookup: payment_addr is forwarded and no undefined appears in the URL', async () => {
  const lnd = await startFakeLnd('macaroon-test', { r_hash: '', r_preimage: '', description_hash: '', memo: '' });
  try {
    const res = buildResponse();
    invoiceLookup(buildRequest(lnd, { payment_addr: 'abcdef' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, '/v2/invoices/lookup?payment_addr=abcdef');
  } finally {
    await lnd.close();
  }
});

test('invoiceLookup: payment_hash is forwarded when payment_addr is absent', async () => {
  const lnd = await startFakeLnd('macaroon-test', { r_hash: '', r_preimage: '', description_hash: '', memo: '' });
  try {
    const res = buildResponse();
    invoiceLookup(buildRequest(lnd, { payment_hash: 'deadbeef' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, '/v2/invoices/lookup?payment_hash=deadbeef');
  } finally {
    await lnd.close();
  }
});

test('invoiceLookup: empty payment_hash returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    invoiceLookup(buildRequest(lnd, { payment_hash: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'payment_hash must be a non-empty string');
  } finally {
    await lnd.close();
  }
});

test('invoiceLookup: empty payment_addr returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    invoiceLookup(buildRequest(lnd, { payment_addr: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'payment_addr must be a non-empty string');
  } finally {
    await lnd.close();
  }
});
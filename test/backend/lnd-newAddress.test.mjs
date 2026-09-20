import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { getNewAddress } from '../../backend/controllers/lnd/newAddress.js';

const startFakeLnd = async (macaroon) => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url, macaroon: req.headers['grpc-metadata-macaroon'] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ address: 'bc1qtest' }));
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

test('getNewAddress: empty query omits type from the URL', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getNewAddress(buildRequest(lnd, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, '/v1/newaddress');
  } finally {
    await lnd.close();
  }
});

test('getNewAddress: type=p2tr is forwarded', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getNewAddress(buildRequest(lnd, { type: 'p2tr' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/newaddress?type=p2tr');
  } finally {
    await lnd.close();
  }
});

test('getNewAddress: type=p2wkh is forwarded', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getNewAddress(buildRequest(lnd, { type: 'p2wkh' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v1/newaddress?type=p2wkh');
  } finally {
    await lnd.close();
  }
});

test('getNewAddress: unknown type returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getNewAddress(buildRequest(lnd, { type: 'p2sh' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'type must be one of p2wkh, np2wkh, p2tr');
  } finally {
    await lnd.close();
  }
});

test('getNewAddress: empty type returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getNewAddress(buildRequest(lnd, { type: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
  } finally {
    await lnd.close();
  }
});
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { getUTXOs } from '../../backend/controllers/lnd/wallet.js';

const startFakeLnd = async (macaroon) => {
  const seen = [];
  const server = createServer((req, res) => {
    let rawBody = '';
    req.on('data', (chunk) => { rawBody += chunk; });
    req.on('end', () => {
      seen.push({
        method: req.method,
        path: req.url,
        macaroon: req.headers['grpc-metadata-macaroon'],
        body: rawBody
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ utxos: [] }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    seen,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

const buildRequest = (node, query = {}, version = '0.15.0') => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'test-node',
      lnImplementation: 'LND',
      lnVersion: version,
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

test('getUTXOs: empty query sends no max_confs in URL or body', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getUTXOs(buildRequest(lnd, {}, '0.15.0'), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen.length, 1);
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.ok(!lnd.seen[0].body.includes('undefined'), `body contained undefined: ${lnd.seen[0].body}`);
    assert.equal(lnd.seen[0].path, '/v2/wallet/utxos');
    assert.equal(lnd.seen[0].body, '{}');
  } finally {
    await lnd.close();
  }
});

test('getUTXOs: valid max_confs is forwarded in the form body (LND >= 0.14)', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getUTXOs(buildRequest(lnd, { max_confs: '100' }, '0.15.0'), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v2/wallet/utxos');
    assert.equal(lnd.seen[0].body, '{"max_confs":100}');
  } finally {
    await lnd.close();
  }
});

test('getUTXOs: pre-0.14 sends max_confs as a query param', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getUTXOs(buildRequest(lnd, { max_confs: '100' }, '0.13.0'), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v2/wallet/utxos?max_confs=100');
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
  } finally {
    await lnd.close();
  }
});

test('getUTXOs: pre-0.14 with empty query sends no max_confs', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getUTXOs(buildRequest(lnd, {}, '0.13.0'), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(lnd.seen[0].path, '/v2/wallet/utxos');
  } finally {
    await lnd.close();
  }
});

test('getUTXOs: invalid max_confs returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getUTXOs(buildRequest(lnd, { max_confs: 'abc' }, '0.15.0'), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'max_confs must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('getUTXOs: empty string max_confs returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getUTXOs(buildRequest(lnd, { max_confs: '' }, '0.15.0'), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
  } finally {
    await lnd.close();
  }
});

test('getUTXOs: oversized max_confs returns 400', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    getUTXOs(buildRequest(lnd, { max_confs: '99999999999999999999' }, '0.15.0'), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0);
    assert.equal(res.body.message, 'max_confs exceeds maximum safe integer');
  } finally {
    await lnd.close();
  }
});
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { closeChannel } from '../../backend/controllers/lnd/channels.js';

const startFakeLnd = async (macaroon) => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url, macaroon: req.headers['grpc-metadata-macaroon'] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({}));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    seen,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

// closeChannel fires the DELETE and returns 202 immediately; wait until the
// fake server has actually received it before asserting on the recorded path.
const waitForSeen = async (lnd, count = 1, timeoutMs = 2000) => {
  const start = Date.now();
  while (lnd.seen.length < count && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 20));
  }
  return lnd.seen.length >= count;
};

const VALID_CHANNEL_POINT = 'a'.repeat(64) + ':0';

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
  params: { channelPoint: VALID_CHANNEL_POINT },
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

test('closeChannel: empty query does not send force=undefined upstream', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    closeChannel(buildRequest(lnd, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 202);
    assert.ok(await waitForSeen(lnd), 'LND should have received the DELETE');
    assert.ok(!lnd.seen[0].path.includes('undefined'), `URL contained undefined: ${lnd.seen[0].path}`);
    assert.equal(lnd.seen[0].path, `/v1/channels/${'a'.repeat(64)}/0`);
  } finally {
    await lnd.close();
  }
});

test('closeChannel: force=true is forwarded', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    closeChannel(buildRequest(lnd, { force: 'true' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 202);
    assert.ok(await waitForSeen(lnd));
    assert.equal(lnd.seen[0].path, `/v1/channels/${'a'.repeat(64)}/0?force=true`);
  } finally {
    await lnd.close();
  }
});

test('closeChannel: force=1 is coerced to true', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    closeChannel(buildRequest(lnd, { force: '1' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 202);
    assert.ok(await waitForSeen(lnd));
    assert.equal(lnd.seen[0].path, `/v1/channels/${'a'.repeat(64)}/0?force=true`);
  } finally {
    await lnd.close();
  }
});

test('closeChannel: force=yes returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    closeChannel(buildRequest(lnd, { force: 'yes' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'force must be a boolean');
  } finally {
    await lnd.close();
  }
});

test('closeChannel: target_conf=1e3 returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    closeChannel(buildRequest(lnd, { force: 'true', target_conf: '1e3' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'target_conf must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('closeChannel: negative sat_per_vbyte returns 400 without calling LND', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    closeChannel(buildRequest(lnd, { force: 'true', sat_per_vbyte: '-1' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(lnd.seen.length, 0, 'LND should not have been called');
    assert.equal(res.body.message, 'sat_per_vbyte must be a non-negative integer');
  } finally {
    await lnd.close();
  }
});

test('closeChannel: valid target_conf and sat_per_vbyte are forwarded', async () => {
  const lnd = await startFakeLnd('macaroon-test');
  try {
    const res = buildResponse();
    closeChannel(buildRequest(lnd, { force: 'true', target_conf: '6', sat_per_vbyte: '20' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 202);
    assert.ok(await waitForSeen(lnd));
    assert.equal(lnd.seen[0].path, `/v1/channels/${'a'.repeat(64)}/0?force=true&target_conf=6&sat_per_vbyte=20`);
  } finally {
    await lnd.close();
  }
});
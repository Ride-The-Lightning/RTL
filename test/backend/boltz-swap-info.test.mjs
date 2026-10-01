import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { getSwapInfo } from '../../backend/controllers/shared/boltz.js';

// getSwapInfo put its swapId path parameter into the Boltz URL as received. Express has already
// percent-decoded it by then, so a value holding "/", ".." or "?" changed which Boltz endpoint
// the request reached. Only a swap id (letters, digits, "-" and "_") is forwarded now.

const startFakeBoltz = async () => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ swap: { id: 'x' } }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (boltzServerUrl, swapId) => ({
  session: { selectedNode: { index: 1, lnNode: 'node', lnImplementation: 'LND', authentication: {}, settings: { boltzServerUrl, logLevel: 'ERROR' } } },
  query: {},
  params: { swapId }
});

const run = async (req) => {
  const out = { statusCode: null, body: null };
  const done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  getSwapInfo(req, out, null);
  await Promise.race([done, new Promise((resolve) => setTimeout(resolve, 500))]);
  return out;
};

test('getSwapInfo: a swap id reaches the swap endpoint', async () => {
  const boltz = await startFakeBoltz();
  try {
    for (const swapId of ['aB3dE9', 'Xy12Zk7PqR4m']) {
      const res = await run(buildRequest(boltz.url, swapId));
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    }
    assert.deepEqual(boltz.seen, [{ method: 'GET', path: '/v1/swap/aB3dE9' }, { method: 'GET', path: '/v1/swap/Xy12Zk7PqR4m' }]);
  } finally { await boltz.close(); }
});

test('getSwapInfo: a malformed swap id is refused with 400 and never sent upstream', async () => {
  const boltz = await startFakeBoltz();
  try {
    for (const swapId of ['../info', 'aB3dE9/../../v1/info', '../createswap', 'aB3dE9?x=1', 'aB3dE9&x=1', 'aB3dE9#x', '..', '', ['a', 'b'], undefined]) {
      const res = await run(buildRequest(boltz.url, swapId));
      assert.equal(res.statusCode, 400, `accepted ${JSON.stringify(swapId)}`);
    }
    assert.equal(boltz.seen.length, 0, JSON.stringify(boltz.seen));
  } finally { await boltz.close(); }
});

import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { loopInfo, loopOutTerms, swap, swaps } from '../../backend/controllers/shared/loop.js';

// #1714: the Loop controller kept one module-level options object, assigned only by loopInfo
// and reused by every other handler. A request made while another node was selected went to
// the first node's Loop server with its macaroon, and the "URL is missing" guard tested
// `options.url`, a key setSwapServerOptions never sets, so it never fired. Every handler now
// builds its options from the session's selected node on each request.

const startFakeLoop = async () => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ path: req.url, macaroon: req.headers['grpc-metadata-macaroon'] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ swaps: [] }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (swapServerUrl, { params = {} } = {}) => ({
  session: { selectedNode: { index: 1, lnNode: 'node', lnImplementation: 'LND', authentication: {}, settings: { swapServerUrl, logLevel: 'ERROR' } } },
  query: {},
  params
});

const buildResponse = () => {
  const out = { statusCode: null, body: null };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  return out;
};

const run = async (handler, req) => { const res = buildResponse(); handler(req, res, null); await res.done; return res; };

for (const [name, handler, path] of [['loopInfo', loopInfo, '/v1/loop/info'], ['loopOutTerms', loopOutTerms, '/v1/loop/out/terms'], ['swaps', swaps, '/v1/loop/swaps']]) {
  test(`${name}: a node with no swapServerUrl gets a 500 and nothing is sent upstream`, async () => {
    const loop = await startFakeLoop();
    try {
      await run(loopInfo, buildRequest(loop.url)); // a previous node's options must not be reused
      const res = await run(handler, buildRequest(undefined));
      assert.equal(res.statusCode, 500);
      assert.match(res.body.error, /Loop Server URL is missing/);
      assert.equal(loop.seen.length, 1);
    } finally { await loop.close(); }
  });
}

test('each request goes to the selected node\'s own Loop server', async () => {
  const a = await startFakeLoop();
  const b = await startFakeLoop();
  try {
    await run(loopInfo, buildRequest(a.url));
    await run(loopOutTerms, buildRequest(b.url));
    await run(swap, buildRequest(b.url, { params: { id: 'abc' } }));
    await run(swaps, buildRequest(a.url));
    assert.deepEqual(a.seen.map((r) => r.path), ['/v1/loop/info', '/v1/loop/swaps']);
    assert.deepEqual(b.seen.map((r) => r.path), ['/v1/loop/out/terms', '/v1/loop/swap/abc']);
  } finally { await a.close(); await b.close(); }
});

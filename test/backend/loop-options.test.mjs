import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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

// setSwapServerOptions reads <swapMacaroonPath>/loop.macaroon and sends it hex-encoded.
const macaroonDir = (bytes) => { const dir = mkdtempSync(join(tmpdir(), 'rtl-loop-')); writeFileSync(join(dir, 'loop.macaroon'), bytes); return dir; };

const buildRequest = (swapServerUrl, { params = {}, macaroon } = {}) => ({
  session: { selectedNode: { index: 1, lnNode: 'node', lnImplementation: 'LND', authentication: macaroon ? { swapMacaroonPath: macaroonDir(macaroon) } : {}, settings: { swapServerUrl, logLevel: 'ERROR' } } },
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

test('each request goes to the selected node\'s own Loop server with its own macaroon', async () => {
  const a = await startFakeLoop();
  const b = await startFakeLoop();
  const nodeA = { url: a.url, macaroon: 'macaroon-a' };
  const nodeB = { url: b.url, macaroon: 'macaroon-b' };
  const hash = 'ab'.repeat(32);
  try {
    await run(loopInfo, buildRequest(nodeA.url, { macaroon: nodeA.macaroon }));
    await run(loopOutTerms, buildRequest(nodeB.url, { macaroon: nodeB.macaroon }));
    await run(swap, buildRequest(nodeB.url, { macaroon: nodeB.macaroon, params: { id: hash } }));
    await run(swaps, buildRequest(nodeA.url, { macaroon: nodeA.macaroon }));
    assert.deepEqual(a.seen.map((r) => r.path), ['/v1/loop/info', '/v1/loop/swaps']);
    assert.deepEqual(b.seen.map((r) => r.path), ['/v1/loop/out/terms', `/v1/loop/swap/${hash}`]);
    const hex = (m) => Buffer.from(m).toString('hex');
    assert.deepEqual(a.seen.map((r) => r.macaroon), [hex(nodeA.macaroon), hex(nodeA.macaroon)]);
    assert.deepEqual(b.seen.map((r) => r.macaroon), [hex(nodeB.macaroon), hex(nodeB.macaroon)]);
  } finally { await a.close(); await b.close(); }
});

test('swap: an id that is not a hex swap hash is refused with 400 and never sent upstream', async () => {
  const loop = await startFakeLoop();
  try {
    for (const id of ['abc', 'ab'.repeat(32) + '?x=1', '../info', undefined]) {
      const res = await run(swap, buildRequest(loop.url, { params: { id } }));
      assert.equal(res.statusCode, 400, `accepted ${id}`);
    }
    assert.equal(loop.seen.length, 0);
  } finally { await loop.close(); }
});

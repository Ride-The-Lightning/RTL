import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import * as loop from '../../backend/controllers/shared/loop.js';

// #660: the Loop controller took any 2xx from swapServerUrl as a Loop reply and passed the body
// on. With the URL pointed at something else that answers 200 (the report: Lightning Terminal's
// web UI), the Loop screens got an HTML page as their data, and Loop Out / Loop In answered
// 201 as if a swap had started. Each handler now checks that the reply is a JSON object carrying
// the fields that call depends on, and answers 502 with a message about the Loop address if not.

// Replies as loopd 0.35 returns them through its REST gateway, trimmed to a few fields each.
const QUOTE_OUT = { swap_fee_sat: '600', prepay_amt_sat: '100', htlc_sweep_fee_sat: '3793', swap_payment_dest: 'Ag==', cltv_delta: 0, conf_target: 2 };
const QUOTE_IN = { swap_fee_sat: '600', htlc_publish_fee_sat: '3875', cltv_delta: 0, conf_target: 2 };
const SWAP = { amt: '250000', id: 'ab'.repeat(32), id_bytes: 'q6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6s=', type: 'LOOP_OUT', state: 'SUCCESS', htlc_address: 'bcrt1qexample' };
const GOOD = [
  [/^\/v1\/loop\/info/, { version: '0.35.4-beta', network: 'regtest', rpc_listen: '127.0.0.1:11010', rest_listen: '0.0.0.0:8081' }],
  [/^\/v1\/loop\/out\/terms/, { min_swap_amount: '50000', max_swap_amount: '5000000', min_cltv_delta: 25, max_cltv_delta: 250 }],
  [/^\/v1\/loop\/in\/terms/, { min_swap_amount: '50000', max_swap_amount: '5000000' }],
  [/^\/v1\/loop\/out\/quote\//, QUOTE_OUT],
  [/^\/v1\/loop\/in\/quote\//, QUOTE_IN],
  [/^\/v1\/loop\/swaps/, { swaps: [SWAP] }],
  [/^\/v1\/loop\/swap\//, SWAP],
  [/^\/v1\/loop\/out$/, { id: 'ab'.repeat(32), id_bytes: SWAP.id_bytes, htlc_address: 'bcrt1qexample', server_message: '' }],
  [/^\/v1\/loop\/in$/, { id: 'cd'.repeat(32), id_bytes: SWAP.id_bytes, htlc_address: 'bcrt1qexample', server_message: '' }]
];

// A server that answers every request 200. `reply` is either a fixed [contentType, body] pair
// or 'loopd', which answers each path as loopd would.
const startServer = async (reply) => {
  const seen = [];
  const server = createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      seen.push(req.method + ' ' + req.url);
      if (reply === 'loopd') {
        const match = GOOD.find(([path]) => path.test(req.url));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(match ? match[1] : {}));
      } else {
        res.writeHead(200, { 'Content-Type': reply[0] });
        res.end(reply[1]);
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (swapServerUrl, extra = {}) => ({
  session: { selectedNode: { index: 1, lnNode: 'node', lnImplementation: 'LND', authentication: {}, settings: { swapServerUrl, logLevel: 'ERROR' } } },
  query: {},
  params: {},
  body: {},
  ...extra
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

// A 32-byte swap hash as the swaps view sends it: URL-safe base64.
const SWAP_ID = Buffer.from('ab'.repeat(32), 'hex').toString('base64').replace(/\//g, '_').replace(/\+/g, '-');

// Every handler, the request it needs, and the status a real reply gets.
const HANDLERS = [
  ['loopInfo', loop.loopInfo, {}, 200],
  ['loopOutTerms', loop.loopOutTerms, {}, 200],
  ['loopInTerms', loop.loopInTerms, {}, 200],
  ['loopOutQuote', loop.loopOutQuote, { params: { amount: '250000' } }, 200],
  ['loopInQuote', loop.loopInQuote, { params: { amount: '250000' } }, 200],
  ['loopOutTermsAndQuotes', loop.loopOutTermsAndQuotes, {}, 200],
  ['loopInTermsAndQuotes', loop.loopInTermsAndQuotes, {}, 200],
  ['swaps', loop.swaps, {}, 200],
  ['swap', loop.swap, { params: { id: SWAP_ID } }, 200],
  ['loopOut', loop.loopOut, { body: { amount: 250000, targetConf: 2, swapFee: 600, minerFee: 3793, prepayAmt: 100, chanId: '', destAddress: '' } }, 201],
  ['loopIn', loop.loopIn, { body: { amount: 250000, swapFee: 600, minerFee: 3875 } }, 201]
];

const HTML = '<!doctype html><html lang="en"><head><title>Lightning Terminal</title></head><body><div id="root"></div></body></html>';
const NOT_LOOP = [
  ['an HTML page', ['text/html', HTML]],
  ['an empty body', ['text/plain', '']],
  ['JSON that is not a Loop reply', ['application/json', JSON.stringify({ hello: 'world' })]],
  ['a JSON array', ['application/json', JSON.stringify([{ id: 'x', version: 'x', swaps: [] }])]],
  ['JSON null', ['application/json', 'null']]
];

for (const [what, reply] of NOT_LOOP) {
  test(`a 200 with ${what} is refused by every Loop handler with a 502 about the Loop address`, async () => {
    const server = await startServer(reply);
    try {
      for (const [name, handler, extra] of HANDLERS) {
        const res = await run(handler, buildRequest(server.url, extra));
        assert.equal(res.statusCode, 502, `${name} answered ${res.statusCode} with ${JSON.stringify(res.body)}`);
        assert.equal(typeof res.body.message, 'string', name);
        assert.match(res.body.error, /did not answer like a Loop server/, name);
        assert.doesNotMatch(JSON.stringify(res.body), /Lightning Terminal|hello/, `${name} passed the upstream body on`);
      }
    } finally { await server.close(); }
  });
}

test('replies shaped like loopd\'s still pass through every handler', async () => {
  const server = await startServer('loopd');
  try {
    for (const [name, handler, extra, status] of HANDLERS) {
      const res = await run(handler, buildRequest(server.url, extra));
      assert.equal(res.statusCode, status, `${name} answered ${res.statusCode} with ${JSON.stringify(res.body)}`);
    }
    const res = await run(loop.swaps, buildRequest(server.url));
    assert.deepEqual(res.body, [SWAP]);
  } finally { await server.close(); }
});

test('swaps: a loopd with no swaps yet answers an empty list, not an error', async () => {
  const server = await startServer(['application/json', JSON.stringify({ swaps: [] })]);
  try {
    const res = await run(loop.swaps, buildRequest(server.url));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, []);
  } finally { await server.close(); }
});

test('termsAndQuotes: terms that are valid but quotes that are not is still a 502', async () => {
  // Terms come back as loopd's, the two quote calls as something else.
  const seen = [];
  const server = createServer((req, res) => {
    seen.push(req.url);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(/terms/.test(req.url) ? { min_swap_amount: '50000', max_swap_amount: '5000000' } : { hello: 'world' }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    for (const handler of [loop.loopOutTermsAndQuotes, loop.loopInTermsAndQuotes]) {
      const res = await run(handler, buildRequest(url));
      assert.equal(res.statusCode, 502, JSON.stringify(res.body));
      assert.match(res.body.error, /did not answer like a Loop server/);
    }
    assert.equal(seen.filter((path) => /quote/.test(path)).length, 4);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

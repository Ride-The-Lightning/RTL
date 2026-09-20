import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { Common } from '../../backend/utils/common.js';
import { loopInfo, loopOutQuote, loopInQuote, loopOutTermsAndQuotes } from '../../backend/controllers/shared/loop.js';

const startFakeLoop = async () => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({ method: req.method, path: req.url });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (req.url.startsWith('/v1/loop/out/terms') || req.url.startsWith('/v1/loop/in/terms')) {
      res.end(JSON.stringify({ min_swap_amount: '100000', max_swap_amount: '1000000' }));
    } else if (req.url.startsWith('/v1/loop/info')) {
      res.end(JSON.stringify({ version: 'test' }));
    } else {
      res.end(JSON.stringify({ swap_payment_dest: '', amount: 0 }));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return {
    url,
    seen,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

// Options in loop.js come from a module-level variable that only `loopInfo` populates.
// Set up: stub setSwapServerOptions so it points at the fake server, then call loopInfo
// once to seed the module variable. After this, the quote handlers work normally.
const seedOptions = async (node) => {
  Common.setSwapServerOptions = () => ({
    baseUrl: node.url,
    uri: '',
    rejectUnauthorized: false,
    json: true,
    headers: {}
  });
  const req = { session: { selectedNode: { settings: { logLevel: 'ERROR' } } } };
  const res = { status: () => res, json: () => res };
  // loopInfo issues the request but does not return the promise; wait for it
  // to actually hit the fake server, then drop it from the recorded list.
  loopInfo(req, res, null);
  const start = Date.now();
  while (node.seen.length === 0 && Date.now() - start < 1000) {
    await new Promise((r) => setTimeout(r, 10));
  }
  node.seen.length = 0;
};

const buildRequest = (params = {}, query = {}) => ({
  session: {
    selectedNode: {
      settings: { logLevel: 'ERROR' }
    }
  },
  params,
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

test('loopOutQuote: empty query omits swap_publication_deadline', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopOutQuote(buildRequest({ amount: '100000' }, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(loop.seen.length, 1);
    assert.ok(!loop.seen[0].path.includes('undefined'), `URL contained undefined: ${loop.seen[0].path}`);
    assert.equal(loop.seen[0].path, '/v1/loop/out/quote/100000?conf_target=2');
  } finally {
    await loop.close();
  }
});

test('loopOutQuote: swapPublicationDeadline is forwarded when present', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopOutQuote(buildRequest({ amount: '100000' }, { swapPublicationDeadline: '144' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(loop.seen[0].path, '/v1/loop/out/quote/100000?conf_target=2&swap_publication_deadline=144');
  } finally {
    await loop.close();
  }
});

test('loopOutQuote: amount=abc returns 400 without calling Loop', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopOutQuote(buildRequest({ amount: 'abc' }, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(loop.seen.length, 0, 'Loop should not have been called');
    assert.equal(res.body.message, 'amount must be a non-negative integer');
  } finally {
    await loop.close();
  }
});

test('loopOutQuote: targetConf=abc returns 400 without calling Loop', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopOutQuote(buildRequest({ amount: '100000' }, { targetConf: 'abc' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(loop.seen.length, 0, 'Loop should not have been called');
    assert.equal(res.body.message, 'targetConf must be a non-negative integer');
  } finally {
    await loop.close();
  }
});

test('loopOutQuote: swapPublicationDeadline=abc returns 400 without calling Loop', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopOutQuote(buildRequest({ amount: '100000' }, { swapPublicationDeadline: 'abc' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(loop.seen.length, 0);
    assert.equal(res.body.message, 'swapPublicationDeadline must be a non-negative integer');
  } finally {
    await loop.close();
  }
});

test('loopInQuote: empty query omits swap_publication_deadline', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopInQuote(buildRequest({ amount: '100000' }, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    assert.equal(loop.seen.length, 1);
    assert.ok(!loop.seen[0].path.includes('undefined'), `URL contained undefined: ${loop.seen[0].path}`);
    assert.equal(loop.seen[0].path, '/v1/loop/in/quote/100000?conf_target=2');
  } finally {
    await loop.close();
  }
});

test('loopInQuote: amount=abc returns 400 without calling Loop', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopInQuote(buildRequest({ amount: 'abc' }, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(loop.seen.length, 0);
  } finally {
    await loop.close();
  }
});

test('loopOutTermsAndQuotes: empty query omits swap_publication_deadline on both calls', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopOutTermsAndQuotes(buildRequest({}, {}), res, null);
    await res.done;

    assert.equal(res.statusCode, 200);
    // 1 terms call + 2 quote calls
    assert.equal(loop.seen.length, 3);
    for (const req of loop.seen) {
      assert.ok(!req.path.includes('undefined'), `URL contained undefined: ${req.path}`);
    }
    assert.equal(loop.seen[0].path, '/v1/loop/out/terms');
    assert.equal(loop.seen[1].path, '/v1/loop/out/quote/100000?conf_target=2');
    assert.equal(loop.seen[2].path, '/v1/loop/out/quote/1000000?conf_target=2');
  } finally {
    await loop.close();
  }
});

test('loopOutTermsAndQuotes: targetConf=abc returns 400 without calling the quote endpoints', async () => {
  const loop = await startFakeLoop();
  try {
    await seedOptions(loop);
    const res = buildResponse();
    loopOutTermsAndQuotes(buildRequest({}, { targetConf: 'abc' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.equal(loop.seen.length, 1, 'Only the terms call should have happened');
  } finally {
    await loop.close();
  }
});
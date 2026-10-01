import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after } from 'node:test';

import express from 'express';

import { genSeed, operateWallet } from '../../backend/controllers/lnd/wallet.js';
import walletRoutes from '../../backend/routes/lnd/wallet.js';
import { Common } from '../../backend/utils/common.js';

// Seed generation takes the optional seed passphrase from the request body and passes it to
// LND as an encoded query value, so every base64 character arrives as sent. The wallet
// handlers log that a seed was generated or a wallet initialised, without the node's response.

const tempDir = mkdtempSync(join(tmpdir(), 'rtl-wallet-'));
after(() => rmSync(tempDir, { recursive: true, force: true }));

const startFakeLnd = async (reply = {}) => {
  const seen = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      seen.push({ method: req.method, path: req.url, body });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reply));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { url, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (url, { body = {}, params = {}, logLevel = 'ERROR', logFile } = {}) => ({
  session: {
    selectedNode: {
      index: 1, lnNode: 'test-node', lnImplementation: 'LND', lnVersion: '0.18.0',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': 'mac' } } },
      settings: { lnServerUrl: url, logLevel, logFile }
    }
  },
  query: {},
  params,
  body
});

const run = async (handler, req) => {
  const out = { statusCode: null, body: null };
  const done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  handler(req, out, null);
  await Promise.race([done, new Promise((resolve) => setTimeout(resolve, 500))]);
  return out;
};

const b64 = (text) => Buffer.from(text, 'latin1').toString('base64');

test('genSeed: the passphrase reaches LND with every base64 character intact', async () => {
  const lnd = await startFakeLnd({ cipher_seed_mnemonic: ['one', 'two'] });
  try {
    // '>>>' and '???' encode to base64 holding '+' and '/'; 'hunter2' ends in '=' padding.
    for (const passphrase of ['hunter2', '>>>', '???', 'p>ss?word~']) {
      const before = lnd.seen.length;
      const res = await run(genSeed, buildRequest(lnd.url, { body: { aezeed_passphrase: b64(passphrase) } }));
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      assert.equal(lnd.seen.length, before + 1);
      const sent = new URL('http://lnd' + lnd.seen[before].path);
      assert.equal(sent.pathname, '/v1/genseed');
      assert.equal(sent.searchParams.get('aezeed_passphrase'), b64(passphrase), `sent ${lnd.seen[before].path}`);
      assert.equal(lnd.seen[before].method, 'GET');
    }
  } finally { await lnd.close(); }
});

test('genSeed: without a passphrase LND is asked for a seed with no query', async () => {
  const lnd = await startFakeLnd({ cipher_seed_mnemonic: ['one', 'two'] });
  try {
    for (const body of [{}, { aezeed_passphrase: '' }, undefined]) {
      const res = await run(genSeed, buildRequest(lnd.url, { body }));
      assert.equal(res.statusCode, 200, JSON.stringify(res.body));
      assert.deepEqual(res.body, { cipher_seed_mnemonic: ['one', 'two'] });
    }
    assert.deepEqual(lnd.seen.map((r) => r.path), ['/v1/genseed', '/v1/genseed', '/v1/genseed']);
  } finally { await lnd.close(); }
});

test('genSeed: a passphrase that is not base64 text is refused with 400 and never sent upstream', async () => {
  const lnd = await startFakeLnd();
  try {
    for (const aezeed_passphrase of ['not base64!', 'Pj4+&x=1', ['Pj4+'], { a: 1 }, 42]) {
      const res = await run(genSeed, buildRequest(lnd.url, { body: { aezeed_passphrase } }));
      assert.equal(res.statusCode, 400, `accepted ${JSON.stringify(aezeed_passphrase)}`);
    }
    assert.equal(lnd.seen.length, 0);
  } finally { await lnd.close(); }
});

test('the wallet routes take the seed request as a POST', async () => {
  // The guard's error path logs against the process-wide selected node, which app startup sets.
  Common.selectedNode = { index: 1, lnNode: 'test-node', lnImplementation: 'LND', settings: { logLevel: 'ERROR' } };
  const app = express();
  app.use((req, res, next) => { req.session = {}; next(); });
  app.use('/wallet', walletRoutes);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    // No session token: a route that exists answers 401 from its guard, one that does not, 404.
    assert.equal((await fetch(base + '/wallet/genseed', { method: 'POST' })).status, 401);
    assert.equal((await fetch(base + '/wallet/genseed')).status, 404);
    assert.equal((await fetch(base + '/wallet/genseed/aHVudGVyMg==')).status, 404);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

// Runs a handler with the node's log level at DEBUG and returns everything it logged.
const logged = async (handler, req, name) => {
  const logFile = join(tempDir, name + '.log');
  writeFileSync(logFile, '');
  req.session.selectedNode.settings.logLevel = 'DEBUG';
  req.session.selectedNode.settings.logFile = logFile;
  const original = console.log;
  let consoleText = '';
  console.log = (...args) => { consoleText += args.join(' ') + '\n'; };
  try {
    const res = await run(handler, req);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { res, text: consoleText + readFileSync(logFile, 'utf8') };
  } finally { console.log = original; }
};

test('genSeed logs the event without the node response', async () => {
  const words = Array.from({ length: 24 }, (_, i) => 'markerword' + i);
  const lnd = await startFakeLnd({ cipher_seed_mnemonic: words, enciphered_seed: 'markerenciphered' });
  try {
    const { res, text } = await logged(genSeed, buildRequest(lnd.url, { body: { aezeed_passphrase: b64('markerpassphrase') } }), 'genseed');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.cipher_seed_mnemonic, words);
    assert.match(text, /Seed Generated/);
    assert.doesNotMatch(text, /markerword|markerenciphered|markerpassphrase/);
    assert.ok(!text.includes(b64('markerpassphrase')));
  } finally { await lnd.close(); }
});

for (const operation of ['initwallet', 'unlockwallet']) {
  test(`operateWallet (${operation}) logs the event without the node response`, async () => {
    const lnd = await startFakeLnd({ admin_macaroon: 'markermacaroon' });
    try {
      const body = { wallet_password: b64('markerpassword'), cipher_seed_mnemonic: ['markerword1', 'markerword2'], aezeed_passphrase: b64('markerpassphrase') };
      const { res, text } = await logged(operateWallet, buildRequest(lnd.url, { body, params: { operation } }), operation);
      assert.equal(res.statusCode, 201, JSON.stringify(res.body));
      assert.match(text, /Wallet Unlocked\/Initialized/);
      assert.doesNotMatch(text, /markermacaroon|markerword|markerpassword|markerpassphrase/);
    } finally { await lnd.close(); }
  });
}

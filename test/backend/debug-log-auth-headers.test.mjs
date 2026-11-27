import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { getAllLightningTransactions } from '../../backend/controllers/lnd/payments.js';
import { loopInTermsAndQuotes, loopOutTermsAndQuotes } from '../../backend/controllers/shared/loop.js';
import { Logger } from '../../backend/utils/logger.js';

// At logLevel DEBUG some handlers logged their whole request options, so header values went
// into the log file. They now log only the URL and query, and the logger masks any `headers`
// map it is handed as data, and the authentication headers RTL sends wherever they appear.

const tempDir = () => mkdtempSync(join(tmpdir(), 'rtl-debug-log-'));

// Log lines are appended asynchronously; wait until the line we expect is there.
const readLog = async (file, marker) => {
  for (let i = 0; i < 100; i++) {
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (text.includes(marker)) { return text; }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail('log never contained ' + marker);
};

const startFakeServer = (reply) => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reply(req.url)));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done))
  })));
};

const buildResponse = () => {
  const out = { statusCode: null, body: null };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  return out;
};

test('the all-transactions handler logs its request URLs without the macaroon at DEBUG', async () => {
  const macaroon = 'aa11bb22cc33dd44ee55ff66';
  const lnd = await startFakeServer(() => ({ invoices: [] }));
  const logFile = join(tempDir(), 'node.log');
  const req = {
    session: { selectedNode: {
      index: 1, lnNode: 'lnd-node', lnImplementation: 'LND',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': macaroon } } },
      settings: { lnServerUrl: lnd.url, logLevel: 'DEBUG', logFile }
    } },
    query: {}
  };
  try {
    const res = buildResponse();
    getAllLightningTransactions(req, res, null);
    await res.done;
    assert.equal(res.statusCode, 200);
    const log = await readLog(logFile, 'All Invoices Options');
    assert.match(log, /num_max_invoices=100000/);
    assert.ok(!log.includes(macaroon), 'macaroon written to the log');
  } finally { await lnd.close(); }
});

for (const [name, handler, prefix] of [['loopOutTermsAndQuotes', loopOutTermsAndQuotes, 'Loop Out'], ['loopInTermsAndQuotes', loopInTermsAndQuotes, 'Loop In']]) {
  test(`${name} logs its quote URLs without the Loop macaroon at DEBUG`, async () => {
    const macaroonBytes = 'loop-macaroon-bytes';
    const loop = await startFakeServer((path) => (path.includes('/terms') ?
      { min_swap_amount: '250000', max_swap_amount: '5000000' } :
      { swap_fee_sat: '1', prepay_amt_sat: '1', htlc_publish_fee_sat: '1', miner_fee: '1', htlc_sweep_fee_sat: '1', cltv_delta: 10, swap_payment_dest: '' }));
    const dir = tempDir();
    writeFileSync(join(dir, 'loop.macaroon'), macaroonBytes);
    const logFile = join(dir, 'node.log');
    const req = {
      session: { selectedNode: {
        index: 1, lnNode: 'lnd-node', lnImplementation: 'LND',
        authentication: { swapMacaroonPath: dir },
        settings: { swapServerUrl: loop.url, logLevel: 'DEBUG', logFile }
      } },
      query: {},
      params: {}
    };
    try {
      const res = buildResponse();
      handler(req, res, null);
      await res.done;
      const log = await readLog(logFile, prefix + ' Max Quote Options');
      assert.match(log, /quote\/5000000/);
      assert.ok(!log.includes(Buffer.from(macaroonBytes).toString('hex')), 'Loop macaroon written to the log');
    } finally { await loop.close(); }
  });
}

test('the logger masks a headers map passed as data', async () => {
  const logFile = join(tempDir(), 'node.log');
  const selectedNode = { index: 1, settings: { logLevel: 'DEBUG', logFile } };
  Logger.log({ selectedNode, level: 'DEBUG', fileName: 'Test', msg: 'Options', data: { url: 'https://node/v1/x', nested: { headers: { rune: 'rune-secret', authorization: 'Basic abc' } } } });
  const log = await readLog(logFile, 'Options');
  assert.match(log, /https:\/\/node\/v1\/x/);
  assert.ok(!log.includes('rune-secret') && !log.includes('Basic abc'), 'header values written to the log');
});

test('the logger masks authentication headers passed without their headers map', async () => {
  const logFile = join(tempDir(), 'node.log');
  const selectedNode = { index: 1, settings: { logLevel: 'DEBUG', logFile } };
  Logger.log({ selectedNode, level: 'DEBUG', fileName: 'Test', msg: 'Headers', data: { 'Grpc-Metadata-macaroon': 'aa11bb22cc33', Rune: 'rune-secret', Authorization: 'Basic abc', accept: 'application/json' } });
  const log = await readLog(logFile, 'Headers');
  assert.match(log, /"accept":"application\/json"/);
  assert.match(log, /"Grpc-Metadata-macaroon":"\*+"/);
  for (const value of ['aa11bb22cc33', 'rune-secret', 'Basic abc']) {
    assert.ok(!log.includes(value), value + ' written to the log');
  }
});

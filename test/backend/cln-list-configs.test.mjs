import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { listConfigs } from '../../backend/controllers/cln/utility.js';

// listConfigs passed Core Lightning's whole listconfigs reply through to the browser and,
// at DEBUG, into the log. The UI reads one option from it (experimental-dual-fund), so the
// handler now returns only the options RTL uses and logs nothing else.

const CONFIGS = {
  'experimental-dual-fund': { set: true, source: 'cmdline' },
  'bitcoin-rpcpassword': { value_str: 'rpc-pass-value', source: '/root/.lightning/config:3' },
  'wallet': { value_str: 'postgres://user:db-pass-value@db/cln', source: 'cmdline' },
  'tor-service-password': { value_str: 'tor-pass-value', source: 'cmdline' },
  'alias': { value_str: 'cln-node', source: 'cmdline' }
};

const startFakeCln = (configs) => {
  const server = createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ configs }));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((done) => server.close(done))
  })));
};

const buildRequest = (url, logFile) => ({
  session: { selectedNode: {
    index: 1, lnNode: 'cln-node', lnImplementation: 'CLN',
    authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { rune: 'rune' } } },
    settings: { lnServerUrl: url, logLevel: 'DEBUG', logFile }
  } }
});

const run = (req) => {
  const out = { statusCode: null, body: null };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  listConfigs(req, out, null);
  return out.done.then(() => out);
};

const readLog = async (file, marker) => {
  for (let i = 0; i < 100; i++) {
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (text.includes(marker)) { return text; }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail('log never contained ' + marker);
};

test('listConfigs returns only the options RTL reads', async () => {
  const cln = await startFakeCln(CONFIGS);
  const logFile = join(mkdtempSync(join(tmpdir(), 'rtl-cln-configs-')), 'node.log');
  try {
    const res = await run(buildRequest(cln.url, logFile));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { configs: { 'experimental-dual-fund': { set: true, source: 'cmdline' } } });
    const log = await readLog(logFile, 'List Configs Received');
    for (const value of ['rpc-pass-value', 'db-pass-value', 'tor-pass-value']) {
      assert.ok(!log.includes(value), value + ' written to the log');
    }
  } finally { await cln.close(); }
});

test('listConfigs answers with an empty configs object when the option is not set', async () => {
  const cln = await startFakeCln({ alias: { value_str: 'cln-node', source: 'cmdline' } });
  try {
    const res = await run(buildRequest(cln.url));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { configs: {} });
  } finally { await cln.close(); }
});

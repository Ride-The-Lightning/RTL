import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { postChannel } from '../../backend/controllers/lnd/channels.js';

// LND grew a `fund_max` flag on OpenChannelRequest (lightningnetwork/lnd#6903) so the node
// itself works out the largest fundable amount — the wallet balance less the on-chain fee
// and the reserve it holds back for anchor channels. RTL cannot compute that client side,
// which is why #155 sat open until the API existed. LND rejects a request that carries both
// `fund_max` and `local_funding_amount`, so exactly one of them must reach the node.
//
// The fake node records the body it was handed, which is what these tests assert on.

const startFakeLnd = async (macaroon) => {
  const seen = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      seen.push({ method: req.method, path: req.url, macaroon: req.headers['grpc-metadata-macaroon'], body: raw ? JSON.parse(raw) : null });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ funding_txid_str: 'txid-1' }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    seen,
    url: `http://127.0.0.1:${server.address().port}`,
    macaroon,
    close: () => new Promise((resolve) => server.close(resolve))
  };
};

const buildRequest = (node, body) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'lnd-node',
      lnImplementation: 'LND',
      authentication: {
        options: { url: '', rejectUnauthorized: false, json: true, headers: { 'Grpc-Metadata-macaroon': node.macaroon } }
      },
      settings: { lnServerUrl: node.url, logLevel: 'ERROR' }
    }
  },
  body,
  query: {}
});

const buildResponse = () => {
  const out = { statusCode: null, body: null };
  out.done = new Promise((resolve) => {
    out.status = (code) => { out.statusCode = code; return out; };
    out.json = (payload) => { out.body = payload; resolve(payload); return out; };
  });
  return out;
};

test('postChannel sends fund_max and no local_funding_amount when the entire balance is requested', async () => {
  const node = await startFakeLnd('macaroon-A');
  try {
    const res = buildResponse();
    postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: true, private: false, spend_unconfirmed: false, trans_type: '2', trans_type_value: '12' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    assert.equal(node.seen.length, 1);
    const sent = node.seen[0].body;
    assert.equal(sent.fund_max, true);
    assert.ok(!('local_funding_amount' in sent), 'LND rejects fund_max alongside a funding amount: ' + JSON.stringify(sent));
    // The rest of the request is unaffected by the flag.
    assert.equal(sent.node_pubkey_string, 'peer-1');
    assert.equal(sent.sat_per_vbyte, '12');
  } finally {
    await node.close();
  }
});

test('postChannel sends local_funding_amount and no fund_max for an explicit amount', async () => {
  const node = await startFakeLnd('macaroon-A');
  try {
    const res = buildResponse();
    postChannel(buildRequest(node, { node_pubkey: 'peer-1', local_funding_amount: 250000, private: true, spend_unconfirmed: true, trans_type: '1', trans_type_value: '6' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    const sent = node.seen[0].body;
    assert.equal(sent.local_funding_amount, 250000);
    assert.ok(!('fund_max' in sent), 'fund_max must not be sent unless asked for, so pre-0.16 nodes never see it: ' + JSON.stringify(sent));
    assert.equal(sent.private, true);
    assert.equal(sent.spend_unconfirmed, true);
    assert.equal(sent.target_conf, '6');
  } finally {
    await node.close();
  }
});

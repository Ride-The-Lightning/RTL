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
    assert.equal(node.seen[0].macaroon, 'macaroon-A');
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

// The API also accepts urlencoded bodies, which deliver every field as a string, so a client
// that spells the flag out as `fund_max=false` arrives here as the truthy string 'false'.
// Reading that as a request for the entire wallet is the opposite of what it asked for.
test('postChannel does not read a "false" fund_max as a request for the entire balance', async () => {
  const node = await startFakeLnd('macaroon-A');
  try {
    const res = buildResponse();
    postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: 'false', local_funding_amount: 250000, private: false, spend_unconfirmed: false, trans_type: '0', trans_type_value: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    const sent = node.seen[0].body;
    assert.equal(sent.local_funding_amount, 250000);
    assert.ok(!('fund_max' in sent), 'a falsy string must not commit the whole wallet: ' + JSON.stringify(sent));
  } finally {
    await node.close();
  }
});

// The two fields mean different things and differ by the whole on-chain wallet, so a body
// carrying both is ambiguous. Resolving it by branch order would silently drop the caller's
// amount and commit everything, so the request is refused instead.
test('postChannel refuses a request carrying both fund_max and local_funding_amount', async () => {
  const node = await startFakeLnd('macaroon-A');
  try {
    const res = buildResponse();
    postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: true, local_funding_amount: 250000, private: false, spend_unconfirmed: false, trans_type: '0', trans_type_value: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /not both/);
    assert.equal(node.seen.length, 0, 'nothing may reach the node for an ambiguous body: ' + JSON.stringify(node.seen));
  } finally {
    await node.close();
  }
});

// An amount left in the body as an empty string is what an untouched form field sends, not a
// second instruction, so it must not be read as a conflict.
test('postChannel funds the max when the amount field is present but empty', async () => {
  const node = await startFakeLnd('macaroon-A');
  try {
    const res = buildResponse();
    postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: 'true', local_funding_amount: '', private: false, spend_unconfirmed: false, trans_type: '0', trans_type_value: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    const sent = node.seen[0].body;
    assert.equal(sent.fund_max, true);
    assert.ok(!('local_funding_amount' in sent), JSON.stringify(sent));
  } finally {
    await node.close();
  }
});

// A urlencoded body cannot carry a boolean, so the flag arrives spelled however the client
// writes it: an HTML checkbox posts 'on', scripts post '1' or 'True', and a field repeated in
// the body arrives as an array. A spelling the controller does not recognize must not fall
// through to the amount branch -- for a caller that sent only the flag that leaves LND with
// neither funding field, and paired with an amount it opens a channel for that amount while
// the caller believed the whole wallet was committed.
for (const spelling of ['on', '1', 1, 'True', 'TRUE', ' true ', 'yes']) {
  test('postChannel funds the max for fund_max=' + JSON.stringify(spelling), async () => {
    const node = await startFakeLnd('macaroon-A');
    try {
      const res = buildResponse();
      postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: spelling, private: false, spend_unconfirmed: false, trans_type: '0', trans_type_value: '' }), res, null);
      await res.done;

      assert.equal(res.statusCode, 201, JSON.stringify(res.body));
      const sent = node.seen[0].body;
      assert.equal(sent.fund_max, true);
      assert.ok(!('local_funding_amount' in sent), JSON.stringify(sent));
    } finally {
      await node.close();
    }
  });
}

for (const spelling of ['off', 'no', '0', 0, 'FALSE']) {
  test('postChannel uses the amount for fund_max=' + JSON.stringify(spelling), async () => {
    const node = await startFakeLnd('macaroon-A');
    try {
      const res = buildResponse();
      postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: spelling, local_funding_amount: 250000, private: false, spend_unconfirmed: false, trans_type: '0', trans_type_value: '' }), res, null);
      await res.done;

      assert.equal(res.statusCode, 201, JSON.stringify(res.body));
      const sent = node.seen[0].body;
      assert.equal(sent.local_funding_amount, 250000);
      assert.ok(!('fund_max' in sent), 'a false spelling must not commit the whole wallet: ' + JSON.stringify(sent));
    } finally {
      await node.close();
    }
  });
}

// Neither list matches, so there is no reading of the request that is safe to guess at.
for (const spelling of ['maybe', ['true', 'true'], { on: true }, 2]) {
  test('postChannel refuses an unrecognized fund_max=' + JSON.stringify(spelling), async () => {
    const node = await startFakeLnd('macaroon-A');
    try {
      const res = buildResponse();
      postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: spelling, private: false, spend_unconfirmed: false, trans_type: '0', trans_type_value: '' }), res, null);
      await res.done;

      assert.equal(res.statusCode, 400, JSON.stringify(res.body));
      assert.match(res.body.error, /must be true or false/);
      assert.equal(node.seen.length, 0, 'nothing may reach the node for a rejected body');
    } finally {
      await node.close();
    }
  });
}

// A zero amount cannot open a channel, so like an empty string it is an untouched form field
// rather than a second instruction contradicting fund_max.
test('postChannel funds the max when the amount field is present but zero', async () => {
  const node = await startFakeLnd('macaroon-A');
  try {
    const res = buildResponse();
    postChannel(buildRequest(node, { node_pubkey: 'peer-1', fund_max: true, local_funding_amount: 0, private: false, spend_unconfirmed: false, trans_type: '0', trans_type_value: '' }), res, null);
    await res.done;

    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    assert.equal(node.seen[0].body.fund_max, true);
  } finally {
    await node.close();
  }
});

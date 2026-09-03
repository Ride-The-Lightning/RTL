import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { getChannels, openChannel } from '../../backend/controllers/eclair/channels.js';

// Eclair answers /open with HTTP 200 whether or not a channel was opened: the body is the string
// 'created channel <id> ...' when it was, and the reason when it was not. It also lists a channel in
// /channels from the moment the open starts, before the channel has any commitments. RTL used to
// take every /open reply as a success and then crash on the commitment-less entry, so a failed open
// reached the user as "Channel Added Successfully!" followed by "Unknown Error". These tests pin both.

const PEER_ID = '03' + 'cd'.repeat(32);

const normalChannel = {
  nodeId: PEER_ID,
  channelId: '11'.repeat(32),
  state: 'NORMAL',
  data: {
    commitments: {
      params: { channelFlags: { announceChannel: true }, localParams: { isInitiator: true } },
      active: [{ localCommit: { spec: { toLocal: 24000000, toRemote: 1000000 } } }]
    },
    channelUpdate: { shortChannelId: '900000x1x0', feeBaseMsat: 1000, feeProportionalMillionths: 100 }
  }
};

// The shape eclair returns for a channel whose funding transaction does not exist yet
// (WAIT_FOR_FUNDING_INTERNAL, and CLOSED for a minute afterwards when the funding failed):
// channel parameters, no commitments.
const openingChannel = {
  nodeId: PEER_ID,
  channelId: '22'.repeat(32),
  state: 'WAIT_FOR_FUNDING_INTERNAL',
  data: {
    channelParams: { localParams: { isChannelOpener: true } },
    channelType: 'anchor_outputs_zero_fee_htlc_tx',
    localCommitParams: { dustLimit: 546 },
    remoteCommitParams: { dustLimit: 546 }
  }
};

const startFakeEclair = async ({ openReply, channels }) => {
  const seen = [];
  const server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      seen.push({ path: req.url, form: Object.fromEntries(new URLSearchParams(raw)) });
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/open') {
        res.end(JSON.stringify(openReply));
      } else if (req.url === '/channels') {
        res.end(JSON.stringify(channels));
      } else if (req.url === '/nodes') {
        res.end(JSON.stringify([{ nodeId: PEER_ID, alias: 'cln' }]));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: 'http://127.0.0.1:' + port, seen, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (node, body) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'eclair-node',
      lnImplementation: 'ECL',
      authentication: {
        options: {
          url: '',
          rejectUnauthorized: false,
          json: true,
          headers: { authorization: 'Basic ' + Buffer.from(':pw').toString('base64') }
        }
      },
      settings: { lnServerUrl: node.url, logLevel: 'ERROR' }
    }
  },
  body,
  query: {}
});

const invoke = (handler, node, body) => new Promise((resolve) => {
  const out = { statusCode: null, body: null };
  const res = {
    status: (code) => { out.statusCode = code; return res; },
    json: (payload) => { out.body = payload; resolve(out); return res; }
  };
  handler(buildRequest(node, body), res, () => { });
});

const openBody = { nodeId: PEER_ID, fundingSatoshis: 25000, announceChannel: true };

test('openChannel reports a created channel as a success', async () => {
  const reply = 'created channel ' + '11'.repeat(32) + ' with fundingTxId=' + '33'.repeat(32) + ' and fees=167 sat';
  const node = await startFakeEclair({ openReply: reply, channels: [] });
  try {
    const res = await invoke(openChannel, node, openBody);
    assert.equal(res.statusCode, 201, JSON.stringify(res.body));
    assert.equal(res.body, reply);
    const open = node.seen.find((call) => call.path === '/open');
    assert.equal(open.form.nodeId, PEER_ID);
    assert.equal(open.form.fundingSatoshis, '25000');
  } finally {
    await node.close();
  }
});

test('openChannel reports a rejected open as an error carrying eclair\'s reason', async () => {
  const reason = 'wallet error: Insufficient funds (code: -4)';
  const node = await startFakeEclair({ openReply: reason, channels: [] });
  try {
    const res = await invoke(openChannel, node, openBody);
    assert.equal(res.statusCode, 500, JSON.stringify(res.body));
    assert.equal(res.body.error, reason);
    assert.equal(res.body.message, reason);
  } finally {
    await node.close();
  }
});

test('openChannel treats every reply other than "created channel" as a failure', async () => {
  const replies = [
    'wallet error: requirement failed: mining fee is higher than budget (167 sat > 25 sat)',
    'peer aborted the channel funding flow: \'dustLimit=546 sat is above our channelReserve=250 sat\'',
    'disconnected',
    'open channel cancelled, took too long',
    'channel creation cancelled'
  ];
  for (const reply of replies) {
    const node = await startFakeEclair({ openReply: reply, channels: [] });
    try {
      const res = await invoke(openChannel, node, openBody);
      assert.equal(res.statusCode, 500, reply + ' must not be reported as a success');
      assert.equal(res.body.error, reply);
    } finally {
      await node.close();
    }
  }
});

test('getChannels lists a channel that has no commitments yet, with zero balances', async () => {
  const node = await startFakeEclair({ openReply: '', channels: [normalChannel, openingChannel] });
  try {
    const res = await invoke(getChannels, node, {});
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(res.body.length, 2);
    const [normal, opening] = res.body;
    assert.equal(normal.state, 'NORMAL');
    assert.equal(normal.toLocal, 24000);
    assert.equal(normal.toRemote, 1000);
    assert.equal(normal.announceChannel, true);
    assert.equal(normal.alias, 'cln');
    assert.equal(opening.state, 'WAIT_FOR_FUNDING_INTERNAL');
    assert.equal(opening.toLocal, 0);
    assert.equal(opening.toRemote, 0);
    assert.equal(opening.channelId, '22'.repeat(32));
    assert.equal(opening.alias, 'cln');
  } finally {
    await node.close();
  }
});

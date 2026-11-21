import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { connectPeer } from '../../backend/controllers/eclair/peers.js';

// After a connect, the controller returns the node's peer list with the peer just connected
// first. Eclair reports node ids in lower case, whatever case the request used.

const KEY_ONE = '02' + '1a'.repeat(32);
const KEY_NEW = '03' + 'ab'.repeat(32);
const KEY_TWO = '02' + '2c'.repeat(32);

const startFakeEclair = async (peers) => {
  const server = createServer((req, res) => {
    req.resume();
    const reply = (body) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (req.url === '/connect') { return reply('connected'); }
    if (req.url === '/peers') { return reply(peers); }
    if (req.url === '/nodes') { return reply(peers.map((peer) => ({ nodeId: peer.nodeId, alias: 'alias-' + peer.nodeId.substring(0, 4) }))); }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (node, query) => ({
  session: {
    selectedNode: {
      index: 1,
      lnNode: 'eclair-node',
      lnImplementation: 'ECL',
      authentication: { options: { url: '', rejectUnauthorized: false, json: true, headers: { authorization: 'Basic ' + Buffer.from(':pw').toString('base64') } } },
      settings: { lnServerUrl: node.url, logLevel: 'ERROR' }
    }
  },
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

const connect = async (peers, query) => {
  const node = await startFakeEclair(peers);
  try {
    const res = buildResponse();
    connectPeer(buildRequest(node, query), res, null);
    await res.done;
    return res;
  } finally {
    await node.close();
  }
};

const listed = () => [{ nodeId: KEY_ONE }, { nodeId: KEY_NEW }, { nodeId: KEY_TWO }];

test('connectPeer: the connected peer leads the list when its node id was sent in upper case', async () => {
  const byNodeId = await connect(listed(), { nodeId: KEY_NEW.toUpperCase() });
  assert.equal(byNodeId.statusCode, 201, JSON.stringify(byNodeId.body));
  assert.deepEqual(byNodeId.body.map((p) => p.nodeId), [KEY_NEW, KEY_ONE, KEY_TWO]);

  const byUri = await connect(listed(), { uri: KEY_NEW.toUpperCase() + '@10.0.0.1:9735' });
  assert.equal(byUri.statusCode, 201, JSON.stringify(byUri.body));
  assert.deepEqual(byUri.body.map((p) => p.nodeId), [KEY_NEW, KEY_ONE, KEY_TWO]);
});

test('connectPeer: the list keeps the node\'s order when the connected peer is not in it', async () => {
  const res = await connect([{ nodeId: KEY_ONE }, { nodeId: KEY_TWO }], { nodeId: KEY_NEW });
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.deepEqual(res.body.map((p) => p.nodeId), [KEY_ONE, KEY_TWO]);
});

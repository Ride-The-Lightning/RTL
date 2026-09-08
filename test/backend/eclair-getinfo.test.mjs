import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test, { after } from 'node:test';

import { getInfo } from '../../backend/controllers/eclair/getInfo.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// Eclair's getinfo reports nodeId and publicAddresses separately and has no uris field. The
// Public Key dialog only offers a node URI when uris is non-empty, so the handler has to build
// them, the way the Core Lightning handler does from id and address.

// Importing the controller loads the websocket server, whose ping timer would otherwise keep
// the test process alive after the last test.
after(() => clearInterval(WSServer.pingInterval));

const NODE_ID = '03' + 'cd'.repeat(32);

const startFakeEclair = async (publicAddresses) => {
  const server = createServer((req, res) => {
    req.on('data', () => { });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/getinfo') {
        res.end(JSON.stringify({
          version: '0.14.2-3dd8d2d',
          nodeId: NODE_ID,
          alias: 'eclair',
          color: '#49daaa',
          features: { activated: {}, unknown: [] },
          chainHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
          network: 'mainnet',
          blockHeight: 900000,
          publicAddresses,
          instanceId: 'a0b1c2d3'
        }));
      } else {
        res.statusCode = 404;
        res.end('{}');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: 'http://127.0.0.1:' + port, close: () => new Promise((resolve) => server.close(resolve)) };
};

const buildRequest = (node) => ({
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
  }
});

const invoke = (node) => new Promise((resolve) => {
  const out = { statusCode: null, body: null };
  const res = {
    status: (code) => { out.statusCode = code; return res; },
    json: (payload) => { out.body = payload; resolve(out); return res; }
  };
  getInfo(buildRequest(node), res, () => { });
});

test('getInfo builds a URI for each public address', async () => {
  const node = await startFakeEclair(['203.0.113.7:9735', 'abcdefghijklmnopqrstuvwxyz234567abcdefghijklmnopqrstuvwxyz234567.onion:9735']);
  try {
    const res = await invoke(node);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.uris, [
      NODE_ID + '@203.0.113.7:9735',
      NODE_ID + '@abcdefghijklmnopqrstuvwxyz234567abcdefghijklmnopqrstuvwxyz234567.onion:9735'
    ]);
    // The fields the rest of the Eclair store reads are untouched.
    assert.equal(res.body.nodeId, NODE_ID);
    assert.deepEqual(res.body.publicAddresses, ['203.0.113.7:9735', 'abcdefghijklmnopqrstuvwxyz234567abcdefghijklmnopqrstuvwxyz234567.onion:9735']);
    assert.equal(res.body.lnImplementation, 'Eclair');
  } finally {
    await node.close();
  }
});

test('getInfo leaves uris empty when the node has no public address', async () => {
  const node = await startFakeEclair([]);
  try {
    const res = await invoke(node);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.deepEqual(res.body.uris, []);
  } finally {
    await node.close();
  }
});

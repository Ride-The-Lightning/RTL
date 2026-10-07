import assert from 'node:assert/strict';
import test, { after, afterEach, beforeEach } from 'node:test';

import { getInfo as getInfoLND } from '../../backend/controllers/lnd/getInfo.js';
import { getInfo as getInfoCLN } from '../../backend/controllers/cln/getInfo.js';
import { getInfo as getInfoECL } from '../../backend/controllers/eclair/getInfo.js';
import { updateSelNodeOptions } from '../../backend/controllers/lnd/wallet.js';
import { Common } from '../../backend/utils/common.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// A valid JWT outlives its session: a dropped cookie, or a session expired while the token
// survived, reaches the handlers with no selectedNode on the session. updateSelectedNodeOptions
// put a bare {} there and then read {}.authentication.options outside its try, so the request
// failed with a TypeError (400 {}) instead of the intended 401, and the {} stayed on the session
// to fail its next request too.

// Importing the controllers loads the websocket server, whose ping timer would otherwise keep
// the test process alive after the last test.
after(() => clearInterval(WSServer.pingInterval));

// A booted server has its configured nodes and a process-wide default node (config.ts), which
// is what the handlers fall back on when the session has none.
const savedNodes = Common.nodes;
const savedSelectedNode = Common.selectedNode;
beforeEach(() => {
  const node = {
    index: 1, lnNode: 'eclair-node', lnImplementation: 'ECL',
    authentication: { lnApiPassword: 'pw', options: { headers: { authorization: 'Basic OnB3' } } },
    settings: { lnServerUrl: 'http://127.0.0.1:1', logLevel: 'ERROR' }
  };
  Common.nodes = [node];
  Common.selectedNode = node;
});
afterEach(() => {
  Common.nodes = savedNodes;
  Common.selectedNode = savedSelectedNode;
});

const invoke = (handler, req) => new Promise((resolve, reject) => {
  const out = { statusCode: null, body: null };
  const res = {
    status: (code) => { out.statusCode = code; return res; },
    json: (payload) => { out.body = payload; resolve(out); return res; }
  };
  try {
    handler(req, res, () => { });
  } catch (err) {
    reject(err);
  }
});

for (const [name, handler] of [['LND getinfo', getInfoLND], ['CLN getinfo', getInfoCLN], ['Eclair getinfo', getInfoECL], ['LND updateSelNodeOptions', updateSelNodeOptions]]) {
  test(`${name} answers 401 for a session with no selected node, and leaves the session without one`, async () => {
    const req = { session: {} };
    for (const attempt of ['first', 'second']) {
      const res = await invoke(handler, req);
      assert.equal(res.statusCode, 401, `${attempt} request: ${JSON.stringify(res.body)}`);
      assert.equal(req.session.selectedNode, undefined, `${attempt} request stored ${JSON.stringify(req.session.selectedNode)}`);
    }
  });
}

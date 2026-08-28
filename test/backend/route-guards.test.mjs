import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import express from 'express';

import eclChannelsRoutes from '../../backend/routes/eclair/channels.js';
import rtlConfRoutes from '../../backend/routes/shared/RTLConf.js';
import { Common } from '../../backend/utils/common.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// The guard's error path logs against the selected node; before login the session has
// none and handleError falls back to the process-wide one, which app startup normally sets.
Common.selectedNode = { index: 1, lnNode: 'eclair-node', lnImplementation: 'ECL', settings: { logLevel: 'ERROR' } };

// Mount a router the way app.ts does and hit it over a real socket, so the test sees the
// router's middleware order rather than the controller in isolation. No session middleware:
// a request that gets past the guard would reach a controller expecting req.session, and
// the guard itself only reads req.session.selectedNode for the log line.
const withRouter = async (mountPath, router, fn) => {
  const app = express();
  app.use((req, res, next) => { req.session = {}; next(); });
  app.use(mountPath, router);
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    await fn(base);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    clearInterval(WSServer.pingInterval);
  }
};

test('POST /api/ecl/channels/circularRebalance rejects a request without a session token', async () => {
  await withRouter('/api/ecl/channels', eclChannelsRoutes, async (base) => {
    const res = await fetch(base + '/api/ecl/channels/circularRebalance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amountMsat: 1000, sourceChannelId: 'a', targetChannelId: 'b' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication Failed! Please Login First!');
  });
});

test('GET /api/conf/updateSelNode rejects a request without a session token', async () => {
  await withRouter('/api/conf', rtlConfRoutes, async (base) => {
    const res = await fetch(base + '/api/conf/updateSelNode/1/-1');
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Authentication Failed! Please Login First!');
  });
});

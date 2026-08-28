import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

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

test('GET /api/conf stays reachable without a session token', async () => {
  // The login page depends on this one: it is where the node's name and theme come from.
  await withRouter('/api/conf', rtlConfRoutes, async (base) => {
    const res = await fetch(base + '/api/conf/');
    assert.notEqual(res.status, 401);
  });
});

// Routes the logged-out login page needs. Everything else registered under server/routes
// must carry isAuthenticated as its first handler; a new route missing it shows up here
// rather than in a disclosure. The walk runs over the compiled backend/ (npm run test
// builds it first), and checks the four index routers mount nothing but the leaf routers
// it walked, so a route declared on an index router or a nested sub-router cannot slip past.
const PUBLIC_ROUTES = new Set([
  'shared/authenticate POST /',
  'shared/authenticate POST /token',
  'shared/authenticate GET /logout',
  'shared/RTLConf GET /',
  'shared/RTLConf GET /rates'
]);

test('every route outside the login page set carries isAuthenticated first', async () => {
  const routesDir = join(dirname(fileURLToPath(import.meta.url)), '../../backend/routes');
  const unguarded = [];
  const leafRouters = new Set();
  const seen = {};
  for (const tree of ['lnd', 'cln', 'eclair', 'shared']) {
    seen[tree] = 0;
    for (const file of readdirSync(join(routesDir, tree)).filter((f) => f.endsWith('.js') && f !== 'index.js')) {
      const router = (await import(pathToFileURL(join(routesDir, tree, file)).href)).default;
      leafRouters.add(router);
      for (const layer of router.stack) {
        assert.ok(layer.route, tree + '/' + file + ' registers a non-route layer; extend the walk before relying on it');
        for (const method of Object.keys(layer.route.methods)) {
          seen[tree]++;
          const key = tree + '/' + file.replace(/\.js$/, '') + ' ' + method.toUpperCase() + ' ' + layer.route.path;
          // Position matters: express runs handlers in registration order, so a guard
          // registered after the controller guards nothing.
          const guarded = layer.route.stack[0].name === 'isAuthenticated';
          if (!guarded && !PUBLIC_ROUTES.has(key)) { unguarded.push(key); }
          if (guarded && PUBLIC_ROUTES.has(key)) { unguarded.push(key + ' (listed public but guarded)'); }
        }
      }
    }
    const index = (await import(pathToFileURL(join(routesDir, tree, 'index.js')).href)).default;
    for (const layer of index.stack) {
      assert.ok(!layer.route && leafRouters.has(layer.handle), tree + '/index.js mounts something other than a walked leaf router');
    }
  }
  clearInterval(WSServer.pingInterval);
  for (const tree of Object.keys(seen)) { assert.ok(seen[tree] > 0, 'walked no routes under ' + tree); }
  assert.deepEqual(unguarded, []);
});

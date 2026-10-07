import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after, afterEach, beforeEach } from 'node:test';

import { getApplicationSettings, updateSelectedNode } from '../../backend/controllers/shared/RTLConf.js';
import { Common } from '../../backend/utils/common.js';
import { Database } from '../../backend/utils/database.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// GET /api/conf/updateSelNode/:currNodeIndex/:prevNodeIndex is called by any logged-in session.
// - An index matching no configured node was stored as the process-wide default node before
//   anything checked it, so the unauthenticated GET /api/conf, which the login page loads,
//   failed with a 400 for every client until someone selected a valid node again.
// - prevNodeIndex comes from the client. Unloading it for a session that never had that node
//   removed the last session registered on it instead (splice(-1, 1)), and once the list was
//   empty the node's database was dropped from under the session still using it.

// Importing the controllers loads the websocket server, whose ping timer would otherwise keep
// the test process alive after the last test.
after(() => clearInterval(WSServer.pingInterval));

const node = (index, lnNode) => ({
  index, lnNode, lnImplementation: 'LND',
  authentication: { macaroonPath: '/nonexistent' },
  settings: { lnServerUrl: 'https://127.0.0.1:1', logLevel: 'ERROR', userPersona: 'OPERATOR', themeMode: 'DAY', themeColor: 'PURPLE' }
});

const saved = {};
beforeEach(() => {
  Object.assign(saved, { nodes: Common.nodes, selectedNode: Common.selectedNode, appConfig: Common.appConfig, dbDirectory: Database.dbDirectory, nodeDatabase: Database.nodeDatabase, wss: WSServer.webSocketServer });
  // A running server's websocket server with no sockets connected; selecting a node walks its clients.
  WSServer.webSocketServer = { clients: new Set() };
  Common.nodes = [node(1, 'alice'), node(2, 'bob'), node(3, 'carol')];
  Common.selectedNode = Common.nodes[0];
  Common.appConfig = { ...Common.appConfig, SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' }, nodes: Common.nodes };
  Database.dbDirectory = mkdtempSync(join(tmpdir(), 'rtl-db-'));
  Database.nodeDatabase = {};
});
afterEach(() => {
  Common.nodes = saved.nodes;
  Common.selectedNode = saved.selectedNode;
  Common.appConfig = saved.appConfig;
  Database.dbDirectory = saved.dbDirectory;
  Database.nodeDatabase = saved.nodeDatabase;
  WSServer.webSocketServer = saved.wss;
});

// Settles on any way the handler can answer or fail.
const invoke = (handler, req) => new Promise((resolve, reject) => {
  const out = { statusCode: null, body: null };
  const answer = (payload) => { out.body = payload; resolve(out); return res; };
  const res = {
    status: (code) => { out.statusCode = code; return res; },
    json: answer,
    send: answer,
    end: answer
  };
  try {
    handler(req, res, (err) => reject(err || new Error('handler called next() without answering')));
  } catch (err) {
    reject(err);
  }
});

const selectRequest = (sessionId, selectedNode, currNodeIndex, prevNodeIndex) => ({
  session: { id: sessionId, selectedNode },
  headers: { authorization: 'Bearer token' },
  params: { currNodeIndex, prevNodeIndex }
});

for (const bad of ['999', '0', 'abc', '1.5']) {
  test(`selecting node index ${JSON.stringify(bad)} is refused and changes no selected node`, { timeout: 5000 }, async () => {
    const req = selectRequest('session-a', Common.nodes[1], bad, '2');
    // A throw reaches Express's default error handler, which answers 400 {}.
    const res = await invoke(updateSelectedNode, req).catch((err) => ({ statusCode: 'threw ' + err.message }));

    // What a fresh, unauthenticated client (the login page) gets afterwards.
    const conf = await invoke(getApplicationSettings, { session: {}, headers: {} }).catch((err) => ({ statusCode: 'threw ' + err.message }));
    assert.equal(conf.statusCode, 200, 'the login page config failed: ' + JSON.stringify(conf.body));
    assert.equal(conf.body.selectedNodeIndex, 1);
    assert.equal(Common.selectedNode?.index, 1, 'the process-wide default node changed');
    assert.equal(req.session.selectedNode?.index, 2, "the caller's own selection changed");
    assert.equal(res.statusCode, 404, JSON.stringify(res.body));
  });
}

test('a valid node index still switches the session and the default node', { timeout: 5000 }, async () => {
  const req = selectRequest('session-a', Common.nodes[0], '3', '1');
  const res = await invoke(updateSelectedNode, req);
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.lnNode, 'carol');
  assert.equal(req.session.selectedNode.index, 3);
  assert.equal(Common.selectedNode.index, 3);
});

test("unloading a node a session never had leaves the other sessions' database in place", { timeout: 5000 }, async () => {
  // Session B is working on carol (node 3).
  Database.loadDatabase({ id: 'session-b', selectedNode: Common.nodes[2] });
  assert.ok(Database.nodeDatabase[3], 'setup: carol database loaded for session B');

  // Session A, which never selected carol, claims to be switching away from it.
  const res = await invoke(updateSelectedNode, selectRequest('session-a', Common.nodes[0], '1', '3'));
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));

  assert.ok(Database.nodeDatabase[3], "carol's database was dropped while session B still uses it");
  Database.unloadDatabase(3, 'session-b');
  assert.equal(Database.nodeDatabase[3], undefined, "session B leaving should still unload carol's database");
});

test('a session leaving its own node unloads the database once no session is left on it', { timeout: 5000 }, () => {
  Database.loadDatabase({ id: 'session-a', selectedNode: Common.nodes[2] });
  Database.loadDatabase({ id: 'session-b', selectedNode: Common.nodes[2] });
  Database.unloadDatabase(3, 'session-a');
  assert.ok(Database.nodeDatabase[3], 'unloaded while session B is still on it');
  Database.unloadDatabase(3, 'session-b');
  assert.equal(Database.nodeDatabase[3], undefined);
});

// The node being left is the one on the session, whatever prevNodeIndex the URL carries: a page
// reload sends -1, and a stale or tampered value names some other node. Either way the session
// used to stay registered on the node it left, so that database was never unloaded.
for (const prev of ['-1', '2', 'undefined']) {
  test(`switching away with prevNodeIndex ${JSON.stringify(prev)} unloads the node the session was on`, { timeout: 5000 }, async () => {
    const req = selectRequest('session-a', Common.nodes[2], '1', prev);
    Database.loadDatabase(req.session);
    assert.ok(Database.nodeDatabase[3], 'setup: carol database loaded for session A');

    const res = await invoke(updateSelectedNode, req);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(Database.nodeDatabase[3], undefined, "carol's database is still loaded for a session that left it");
    assert.ok(Database.nodeDatabase[1], "alice's database was not loaded for the session that selected it");
  });
}

// A page reload reselects the node the session is already on. That must not drop the node's
// database and read it back from disk: a failed read would leave a half-built entry behind.
for (const prev of ['-1', '3']) {
  test(`reselecting the session's own node with prevNodeIndex ${JSON.stringify(prev)} keeps its database loaded`, { timeout: 5000 }, async () => {
    const req = selectRequest('session-a', Common.nodes[2], '3', prev);
    Database.loadDatabase(req.session);
    const loaded = Database.nodeDatabase[3];

    const res = await invoke(updateSelectedNode, req);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    assert.equal(Database.nodeDatabase[3], loaded, "carol's database was dropped and reloaded");
    // Still registered: leaving now unloads it.
    Database.unloadDatabase(3, 'session-a');
    assert.equal(Database.nodeDatabase[3], undefined, 'session A is no longer registered on carol');
  });
}

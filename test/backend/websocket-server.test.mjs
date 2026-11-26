import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { EventEmitter } from 'node:events';
import test, { afterEach, beforeEach } from 'node:test';

import { Common } from '../../backend/utils/common.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// Importing this module is enough to create the ping timer, and the LND invoice controller
// pulls it in transitively (invoices -> webSocketClient -> webSocketServer). If the timer holds
// a reference, every test file that touches that path keeps `node --test` alive for the full
// hour rather than exiting when its tests finish.
test('the ping timer does not hold the event loop open', () => {
  assert.equal(WSServer.pingInterval.hasRef(), false);
});

// A browser's websockets keep its node's events flowing for as long as one of them is open, and
// a websocket that opens for a node starts them again. The node's client connects on the first
// CONNECT and disconnects on DISCONNECT, so the last event says whether events still arrive.
const NODE = { index: 1, lnImplementation: 'LND' };

const cookieFor = (sessionId) => {
  const mac = createHmac('sha256', Common.secret_key).update(sessionId).digest('base64').replace(/=+$/, '');
  return 'connect.sid=' + encodeURIComponent('s:' + sessionId + '.' + mac);
};

const startServer = () => {
  const clients = new Set();
  WSServer.webSocketServer = { clients: clients };
  const events = [];
  const onConnect = (index) => events.push('CONNECT ' + index);
  const onDisconnect = (index) => events.push('DISCONNECT ' + index);
  WSServer.eventEmitterLND.on('CONNECT', onConnect);
  WSServer.eventEmitterLND.on('DISCONNECT', onDisconnect);
  const open = (sessionId, nodeIndex) => {
    const socket = new EventEmitter();
    clients.add(socket);
    socket.close = () => { clients.delete(socket); socket.emit('close', 1008, 'Session ended'); };
    const protocol = (nodeIndex === undefined) ? 'token' : 'token, ' + nodeIndex;
    WSServer.mountEventsOnConnection(socket, { headers: { 'cookie': cookieFor(sessionId), 'sec-websocket-protocol': protocol } });
    return socket;
  };
  const stop = () => {
    WSServer.eventEmitterLND.off('CONNECT', onConnect);
    WSServer.eventEmitterLND.off('DISCONNECT', onDisconnect);
  };
  return { events, open, stop };
};

const saved = {};
beforeEach(() => {
  Object.assign(saved, { nodes: Common.nodes, wss: WSServer.webSocketServer, clientDetails: WSServer.clientDetails });
  Common.nodes = [NODE];
  WSServer.clientDetails = [];
});
afterEach(() => {
  Common.nodes = saved.nodes;
  WSServer.webSocketServer = saved.wss;
  WSServer.clientDetails = saved.clientDetails;
});

test('a websocket that reopens after all of a session\'s closed gets the node\'s events again', (t) => {
  const server = startServer();
  t.after(server.stop);
  // The node was selected over HTTP, which registers the session.
  WSServer.updateLNWSClientDetails('session-a', NODE.index, -1);
  server.open('session-a', NODE.index);
  server.open('session-a', NODE.index);
  WSServer.closeClientsOfSessions(() => true);
  assert.equal(server.events.at(-1), 'DISCONNECT 1');
  server.open('session-a', NODE.index);
  assert.equal(server.events.at(-1), 'CONNECT 1');
});

test('closing one of a session\'s websockets keeps the node\'s events for the other', (t) => {
  const server = startServer();
  t.after(server.stop);
  WSServer.updateLNWSClientDetails('session-a', NODE.index, -1);
  const first = server.open('session-a', NODE.index);
  server.open('session-a', NODE.index);
  first.close();
  assert.equal(server.events.at(-1), 'CONNECT 1');
  assert.ok(!server.events.includes('DISCONNECT 1'));
});

test('the node\'s events stop once the last websocket for it closes', (t) => {
  const server = startServer();
  t.after(server.stop);
  const first = server.open('session-a', NODE.index);
  const second = server.open('session-a', NODE.index);
  first.close();
  second.close();
  assert.equal(server.events.at(-1), 'DISCONNECT 1');
});

test('a websocket that names no configured node registers nothing', (t) => {
  const server = startServer();
  t.after(server.stop);
  server.open('session-a');
  server.open('session-a', '');
  server.open('session-a', 7);
  assert.deepEqual(server.events, []);
  assert.deepEqual(WSServer.clientDetails, []);
});

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// The Core Lightning websocket client serialised each message from the node to pass it on,
// with nothing to catch an error in its message handler, so a message nested too deeply to
// serialise ended the RTL process. It now skips such a message with a warning and keeps the
// connection.
//
// The client runs in a child process, so a message that still ended the process shows up as
// that process's exit code. The fake node speaks just enough of the socket.io protocol over
// a plain websocket: the engine.io open packet, the namespace connect, then event packets.

const clientModule = new URL('../../backend/controllers/cln/webSocketClient.js', import.meta.url).href;
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

const child = (events, logLevel) => `
  import { WebSocketServer } from 'ws';
  import { CLWSClient } from '${clientModule}';
  const events = ${JSON.stringify(events)};
  const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' }, () => {
    CLWSClient.wsServer.sendEventsToAllLNClients = (msg) => {
      console.log('FORWARDED ' + msg.slice(0, 80));
      if (msg.includes('"invoice_payment"')) { process.exit(0); }
    };
    CLWSClient.connect({ index: 1, lnNode: 'cln', lnImplementation: 'CLN',
      settings: { lnServerUrl: 'http://127.0.0.1:' + wss.address().port, logLevel: '${logLevel}' },
      authentication: { runeValue: 'rune' } });
  });
  wss.on('connection', (socket) => {
    socket.send('0' + JSON.stringify({ sid: 'engine', upgrades: [], pingInterval: 25000, pingTimeout: 20000, maxPayload: 10000000 }));
    socket.on('message', (data) => {
      if (String(data) === '40') {
        socket.send('40' + JSON.stringify({ sid: 'socket' }));
        events.forEach((event) => socket.send('42["message",' + event + ']'));
      }
    });
  });
  setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 3000);
`;

const run = (events, logLevel = 'ERROR') => new Promise((resolve) => {
  const proc = spawn(process.execPath, ['--input-type=module', '-e', child(events, logLevel)], { cwd: repoRoot });
  let out = '';
  let err = '';
  proc.stdout.on('data', (chunk) => { out += chunk; });
  proc.stderr.on('data', (chunk) => { err += chunk; });
  proc.on('close', (code) => resolve({ code, out, err }));
});

const EVENT = JSON.stringify({ invoice_payment: { label: 'invoice-1', msat: '1000msat' } });

// At DEBUG the handler also logs the message's data, which serialises the same object. Node 22
// and 24 cannot serialise an object this deep, so there the message is skipped. From Node 26
// JSON.stringify can, so at ERROR the message is passed on. Either way RTL keeps running.
for (const logLevel of ['ERROR', 'DEBUG']) {
  test(`a message nested too deeply to serialise does not stop RTL and later events still arrive (logLevel ${logLevel})`, async () => {
    const deep = '{"data":' + '['.repeat(20000) + ']'.repeat(20000) + '}';
    const { code, out, err } = await run([deep, EVENT], logLevel);
    assert.equal(code, 0, 'client process ended: ' + err);
    assert.match(out, /FORWARDED \{"source":"CLN","data":\{"invoice_payment"/);
  });
}

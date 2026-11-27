import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// The Eclair websocket client parsed every frame from Eclair with JSON.parse inside its
// message handler and serialised it again to pass it on, so a frame that was not a JSON
// object, or was nested too deeply to serialise, threw out of the handler and ended the RTL
// process. It now skips such a frame with a warning and keeps the connection.
//
// The client runs in a child process, so a frame that still ended the process would show up
// as that process's exit code instead of taking the test runner down with it.

const clientModule = new URL('../../backend/controllers/eclair/webSocketClient.js', import.meta.url).href;
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

const child = (frames) => `
  import { WebSocketServer } from 'ws';
  import { ECLWSClient } from '${clientModule}';
  const frames = ${JSON.stringify(frames)};
  const wss = new WebSocketServer({ port: 0, host: '127.0.0.1' }, () => {
    ECLWSClient.wsServer.sendEventsToAllLNClients = (msg) => {
      console.log('FORWARDED ' + msg);
      if (JSON.parse(msg).type === 'payment-received') { process.exit(0); }
    };
    ECLWSClient.connect({ index: 1, lnNode: 'eclair', lnImplementation: 'ECL', lnVersion: '0.14.2',
      settings: { lnServerUrl: 'http://127.0.0.1:' + wss.address().port, logLevel: 'ERROR' },
      authentication: { lnApiPassword: 'pw' } });
  });
  wss.on('connection', (socket) => { frames.forEach((frame) => socket.send(frame)); });
  setTimeout(() => { console.log('TIMEOUT'); process.exit(2); }, 3000);
`;

const run = (frames) => new Promise((resolve) => {
  const proc = spawn(process.execPath, ['--input-type=module', '-e', child(frames)], { cwd: repoRoot });
  let out = '';
  let err = '';
  proc.stdout.on('data', (chunk) => { out += chunk; });
  proc.stderr.on('data', (chunk) => { err += chunk; });
  proc.on('close', (code) => resolve({ code, out, err }));
});

const EVENT = JSON.stringify({ type: 'payment-received', paymentHash: 'ab'.repeat(32), parts: [] });

test('a frame that is not JSON is skipped and later events still arrive', async () => {
  const { code, out, err } = await run(['this is not json {{{', EVENT]);
  assert.equal(code, 0, 'client process ended: ' + err);
  assert.match(out, /FORWARDED .*"type":"payment-received".*"source":"ECL"/);
});

test('JSON frames that are not objects are skipped and later events still arrive', async () => {
  const { code, out, err } = await run(['null', '42', '"text"', EVENT]);
  assert.equal(code, 0, 'client process ended: ' + err);
  assert.equal(out.match(/FORWARDED/g).length, 1);
});

test('an event nested too deeply to pass on is skipped and later events still arrive', async () => {
  const deep = '{"type":"payment-received","parts":' + '['.repeat(20000) + ']'.repeat(20000) + '}';
  const { code, out, err } = await run([deep, EVENT]);
  assert.equal(code, 0, 'client process ended: ' + err);
  assert.equal(out.match(/FORWARDED/g).length, 1);
});

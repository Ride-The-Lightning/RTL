import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { getChannels } from '../../backend/controllers/eclair/channels.js';

// Eclair authenticates with HTTP basic auth, so the request options carry the node's
// lnApiPassword in the authorization header. A DEBUG log of the whole options object
// therefore writes a recoverable credential into the node log file.
const buildRequest = (logFile) => ({
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
          headers: { authorization: 'Basic ' + Buffer.from(':super-secret-password').toString('base64') }
        }
      },
      settings: { lnServerUrl: 'http://127.0.0.1:1/', logLevel: 'DEBUG', logFile: logFile }
    }
  },
  query: {}
});

const waitForLog = async (logFile) => {
  // logger.log appends asynchronously; give it a few turns to flush.
  for (let i = 0; i < 40; i++) {
    const contents = readFileSync(logFile, 'utf-8');
    if (contents.includes('Channels =>')) { return contents; }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return readFileSync(logFile, 'utf-8');
};

test('getChannels does not write the eclair auth header to the node log at DEBUG level', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'ecl-channels-'));
  const logFile = join(tempDir, 'RTL-Node-1.log');
  writeFileSync(logFile, '');
  const req = buildRequest(logFile);
  const res = { status: () => ({ json: () => { } }) };

  try {
    getChannels(req, res, () => { });
    const contents = await waitForLog(logFile);

    assert.ok(contents.includes('Channels =>'), 'expected the controller to have logged at DEBUG level');
    assert.ok(!contents.includes('authorization'), 'auth header key must not reach the node log');
    assert.ok(!contents.includes('super-secret-password'), 'lnApiPassword must not reach the node log');
    assert.ok(!contents.includes(Buffer.from(':super-secret-password').toString('base64')), 'encoded credential must not reach the node log');
    // The diagnostic value of the log — where the call went — is still there.
    assert.ok(contents.includes('/channels'), 'request url should still be logged for diagnostics');
  } finally {
    rmSync(tempDir, { force: true, recursive: true });
  }
});

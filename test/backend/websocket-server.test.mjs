import assert from 'node:assert/strict';
import test from 'node:test';

import { WSServer } from '../../backend/utils/webSocketServer.js';

// Importing this module is enough to create the ping timer, and the LND invoice controller
// pulls it in transitively (invoices -> webSocketClient -> webSocketServer). If the timer holds
// a reference, every test file that touches that path keeps `node --test` alive for the full
// hour rather than exiting when its tests finish.
test('the ping timer does not hold the event loop open', () => {
  assert.equal(WSServer.pingInterval.hasRef(), false);
});

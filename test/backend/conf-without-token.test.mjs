import assert from 'node:assert/strict';
import test, { after, afterEach, beforeEach } from 'node:test';

import { getApplicationSettings } from '../../backend/controllers/shared/RTLConf.js';
import { Common } from '../../backend/utils/common.js';
import { issueSessionToken } from '../../backend/utils/sessionToken.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

// GET /api/conf answers without a session token, because the app loads it before login to
// pick the theme and the login flow. That answer removed a list of fields and returned the
// rest. It now carries only the fields the app reads before login; the full configuration
// still comes with a valid session token.

after(() => clearInterval(WSServer.pingInterval));

const node = (index, lnNode, lnImplementation) => ({
  index, lnNode, lnImplementation, lnVersion: '0.18.0', logLevel: 'DEBUG', logFile: `/home/rtl/RTL/logs/RTL-Node-${index}.log`,
  authentication: { macaroonPath: '/home/rtl/.lnd', configPath: '/home/rtl/.lnd/lnd.conf' },
  settings: {
    lnServerUrl: 'https://10.0.0.5:8080', swapServerUrl: 'https://10.0.0.5:8081', bitcoindConfigPath: '/home/rtl/.bitcoin/bitcoin.conf',
    channelBackupPath: '/home/rtl/backup', blockExplorerUrl: 'http://10.0.0.7:3002', logLevel: 'DEBUG', logFile: `/home/rtl/RTL/logs/RTL-Node-${index}.log`,
    userPersona: 'MERCHANT', themeMode: 'NIGHT', themeColor: 'TEAL', unannouncedChannels: true, fiatConversion: true, currencyUnit: 'EUR',
    enableOffers: true, enablePeerswap: false
  }
});

const saved = {};
beforeEach(() => {
  Object.assign(saved, { nodes: Common.nodes, selectedNode: Common.selectedNode, appConfig: Common.appConfig });
  Common.nodes = [node(1, 'alice', 'LND'), node(2, 'cln-node', 'CLN')];
  Common.selectedNode = Common.nodes[1];
  Common.appConfig = {
    defaultNodeIndex: 2, selectedNodeIndex: 2, dbDirectoryPath: '/home/rtl/db', rtlConfFilePath: '/home/rtl/RTL',
    disableAuth: false, trustedProxies: '10.0.0.1', rtlPass: '', multiPassHashed: 'hash', allowPasswordUpdate: true, enable2FA: true,
    secret2FA: 'secret', SSO: { rtlSSO: 1, rtlCookiePath: '/home/rtl/.cookie', logoutRedirectLink: 'https://btcpay.local', cookieValue: 'cookie' },
    nodes: Common.nodes
  };
});
afterEach(() => {
  Common.nodes = saved.nodes;
  Common.selectedNode = saved.selectedNode;
  Common.appConfig = saved.appConfig;
});

const get = (req) => new Promise((resolve) => {
  const res = { statusCode: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; resolve(res); return res; };
  getApplicationSettings(req, res, null);
});

const LOGIN_CONFIG = {
  selectedNodeIndex: 2,
  disableAuth: false,
  enable2FA: true,
  SSO: { rtlSSO: 1 },
  nodes: [{ index: 2, settings: { userPersona: 'MERCHANT', themeMode: 'NIGHT', themeColor: 'TEAL' } }]
};

test('without a session token the answer carries only what the app reads before login', async () => {
  const res = await get({ session: { id: 'session-a' }, headers: {} });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, LOGIN_CONFIG);
});

test('a token for another session gets the same answer as no token', async () => {
  const token = issueSessionToken('session-b', 'admin');
  const res = await get({ session: { id: 'session-a' }, headers: { authorization: 'Bearer ' + token } });
  assert.deepEqual(res.body, LOGIN_CONFIG);
});

test('the session\'s own node is the one described when the session has selected one', async () => {
  const res = await get({ session: { id: 'session-a', selectedNode: Common.nodes[0] }, headers: {} });
  assert.equal(res.body.selectedNodeIndex, 1);
  assert.deepEqual(res.body.nodes, [{ index: 1, settings: { userPersona: 'MERCHANT', themeMode: 'NIGHT', themeColor: 'TEAL' } }]);
});

test('a selected index that matches no node falls back to the first node instead of failing', async () => {
  Common.selectedNode = { index: 9 };
  const res = await get({ session: { id: 'session-a' }, headers: {} });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.nodes, [{ index: 1, settings: { userPersona: 'MERCHANT', themeMode: 'NIGHT', themeColor: 'TEAL' } }]);
});

test('with the session\'s own token the full configuration is returned, without secrets', async () => {
  const token = issueSessionToken('session-a', 'admin');
  const res = await get({ session: { id: 'session-a' }, headers: { authorization: 'Bearer ' + token } });
  assert.equal(res.body.nodes.length, 2);
  assert.equal(res.body.nodes[1].lnImplementation, 'CLN');
  assert.equal(res.body.nodes[1].settings.blockExplorerUrl, 'http://10.0.0.7:3002');
  assert.equal(res.body.trustedProxies, '10.0.0.1');
  for (const secret of ['rtlConfFilePath', 'multiPassHashed', 'secret2FA']) { assert.equal(res.body[secret], undefined, secret); }
  assert.equal(res.body.SSO.cookieValue, undefined);
});

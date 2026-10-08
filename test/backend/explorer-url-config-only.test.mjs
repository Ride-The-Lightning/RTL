import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { afterEach } from 'node:test';

import { updateApplicationSettings, updateNodeSettings } from '../../backend/controllers/shared/RTLConf.js';
import { Common } from '../../backend/utils/common.js';

// The server fetches the node's block explorer (fee estimates, transaction lookups) and
// returns what it gets, so whoever chooses that URL chooses what the RTL host fetches. It is
// set in RTL-Config.json or BLOCK_EXPLORER_URL only: neither settings endpoint accepts it,
// and a save keeps the configured value in the config file rather than dropping it.

const clone = (value) => JSON.parse(JSON.stringify(value));
const CONFIGURED = 'https://explorer.configured.example';
const INTERNAL = 'http://169.254.169.254/latest/meta-data/?x=';

const saved = {};
let tempDir;
const setup = () => {
  Object.assign(saved, { appConfig: Common.appConfig, nodes: Common.nodes, selectedNode: Common.selectedNode });
  tempDir = mkdtempSync(join(tmpdir(), 'rtl-explorer-'));
  const config = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' },
    nodes: [{
      index: 0, lnNode: 'lnd-main', lnImplementation: 'LND',
      authentication: { macaroonPath: '/lnd/admin' },
      settings: { userPersona: 'OPERATOR', themeMode: 'DAY', lnServerUrl: 'https://lnd:8080', blockExplorerUrl: CONFIGURED }
    }]
  };
  writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(config, null, 2), 'utf-8');
  Common.appConfig = clone({ ...config, selectedNodeIndex: 0, rtlConfFilePath: tempDir, rtlPass: 'hashed-password', SSO: { ...config.SSO, cookieValue: '' } });
  Common.nodes = clone(config.nodes);
  Common.selectedNode = Common.nodes[0];
  return config;
};
afterEach(() => {
  Common.appConfig = saved.appConfig;
  Common.nodes = saved.nodes;
  Common.selectedNode = saved.selectedNode;
  if (tempDir) { rmSync(tempDir, { recursive: true, force: true }); }
});

const call = (handler, req) => {
  let status = null;
  handler(req, { status: (code) => { status = code; return { json: () => {} }; } }, null);
  return status;
};
const persisted = () => JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8')).nodes[0].settings;

test('the application-settings endpoint ignores a block explorer URL', () => {
  const config = setup();
  const status = call(updateApplicationSettings, {
    body: { ...clone(config), selectedNodeIndex: 0, nodes: [{ index: 0, settings: { blockExplorerUrl: INTERNAL, themeMode: 'NIGHT' } }] },
    session: { selectedNode: Common.selectedNode }
  });
  assert.equal(status, 201);
  assert.equal(Common.nodes[0].settings.blockExplorerUrl, CONFIGURED, 'live node');
  assert.equal(Common.appConfig.nodes[0].settings.blockExplorerUrl, CONFIGURED, 'app config');
  assert.equal(persisted().blockExplorerUrl, CONFIGURED, 'RTL-Config.json');
  // Other settings still save.
  assert.equal(persisted().themeMode, 'NIGHT');
});

test('an application-settings save without the explorer keeps it in the config file', () => {
  const config = setup();
  const status = call(updateApplicationSettings, {
    body: { ...clone(config), selectedNodeIndex: 0, nodes: [{ index: 0, settings: { themeMode: 'NIGHT' } }] },
    session: { selectedNode: Common.selectedNode }
  });
  assert.equal(status, 201);
  assert.equal(persisted().blockExplorerUrl, CONFIGURED, 'the save dropped the configured explorer');
});

test('the node-settings endpoint ignores a block explorer URL', () => {
  setup();
  const session = { selectedNode: Common.selectedNode };
  const status = call(updateNodeSettings, { body: { settings: { blockExplorerUrl: INTERNAL, themeMode: 'NIGHT' } }, session });
  assert.equal(status, 201);
  assert.equal(Common.nodes[0].settings.blockExplorerUrl, CONFIGURED, 'live node');
  assert.equal(session.selectedNode.settings.blockExplorerUrl, CONFIGURED, 'session node');
  assert.equal(persisted().blockExplorerUrl, CONFIGURED, 'RTL-Config.json');
});

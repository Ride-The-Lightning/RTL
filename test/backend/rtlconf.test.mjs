import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { updateApplicationSettings } from '../../backend/controllers/shared/RTLConf.js';
import { Common } from '../../backend/utils/common.js';
import { WSServer } from '../../backend/utils/webSocketServer.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

test('updateApplicationSettings preserves indexed node auth and sanitizes only persisted config', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie', logoutRedirectLink: '', cookieValue: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/lnd/admin' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY' }
      },
      {
        index: 2,
        lnNode: 'cln-secondary',
        lnImplementation: 'CLN',
        authentication: { runePath: '/cln/rune' },
        settings: { userPersona: 'MERCHANT', themeMode: 'NIGHT', blockExplorerUrl: 'https://old.example' }
      }
    ]
  };
  const runtimeConfig = clone({
    ...oldConfig,
    selectedNodeIndex: 2,
    enable2FA: true,
    allowPasswordUpdate: true,
    rtlConfFilePath: tempDir,
    rtlPass: 'hashed-password',
    multiPassHashed: 'multi-pass-hash',
    nodes: [
      {
        ...oldConfig.nodes[0],
        authentication: {
          ...oldConfig.nodes[0].authentication,
          options: { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } }
        }
      },
      {
        ...oldConfig.nodes[1],
        authentication: {
          ...oldConfig.nodes[1].authentication,
          runeValue: 'runtime-rune',
          options: { headers: { rune: 'runtime-rune' } }
        }
      }
    ]
  });
  const requestBody = {
    defaultNodeIndex: 0,
    selectedNodeIndex: 2,
    enable2FA: false,
    allowPasswordUpdate: false,
    dbDirectoryPath: '/db-updated',
    secret2FA: '',
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' },
    nodes: [
      {
        index: 2,
        lnNode: 'cln-secondary',
        lnImplementation: 'CLN',
        authentication: { swapMacaroonPath: '/loop/cln' },
        settings: { themeMode: 'DAY' }
      },
      {
        index: 5,
        lnNode: 'new-lnd',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/new-lnd/admin' },
        settings: { userPersona: 'OPERATOR' }
      }
    ]
  };

  try {
    Common.appConfig = clone(runtimeConfig);
    Common.nodes = clone(runtimeConfig.nodes);
    Common.selectedNode = Common.nodes[1];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');

    let responseStatus;
    let responseBody;
    updateApplicationSettings(
      { body: clone(requestBody), session: { selectedNode: Common.selectedNode } },
      {
        status: (status) => {
          responseStatus = status;
          return {
            json: (body) => {
              responseBody = body;
            }
          };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.deepEqual(Common.appConfig.nodes.map((node) => node.index), [0, 2, 5]);

    const runtimeClnNode = Common.appConfig.nodes[1];
    assert.equal(runtimeClnNode.authentication.runePath, '/cln/rune');
    assert.equal(runtimeClnNode.authentication.macaroonPath, undefined);
    assert.equal(runtimeClnNode.authentication.runeValue, 'runtime-rune');
    assert.deepEqual(runtimeClnNode.authentication.options, { headers: { rune: 'runtime-rune' } });
    assert.equal(runtimeClnNode.authentication.swapMacaroonPath, '/loop/cln');
    assert.equal(runtimeClnNode.settings.themeMode, 'DAY');
    assert.equal(runtimeClnNode.settings.blockExplorerUrl, 'https://old.example');

    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.deepEqual(fileConfig.nodes.map((node) => node.index), [0, 2, 5]);
    assert.equal(fileConfig.rtlPass, undefined);
    assert.equal(fileConfig.rtlConfFilePath, undefined);
    assert.equal(fileConfig.selectedNodeIndex, undefined);
    assert.equal(fileConfig.enable2FA, undefined);
    assert.equal(fileConfig.allowPasswordUpdate, undefined);
    assert.equal(fileConfig.nodes[1].authentication.runePath, '/cln/rune');
    assert.equal(fileConfig.nodes[1].authentication.macaroonPath, undefined);
    assert.equal(fileConfig.nodes[1].authentication.runeValue, undefined);
    assert.equal(fileConfig.nodes[1].authentication.options, undefined);
    assert.equal(responseBody.nodes[1].authentication.runePath, undefined);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

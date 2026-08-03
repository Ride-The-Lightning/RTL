import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import test from 'node:test';

import { updateApplicationSettings, getFile } from '../../backend/controllers/shared/RTLConf.js';
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

test('updateApplicationSettings keeps the SSO cookie server-side without exposing or persisting it', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-sso-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 1, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/lnd/admin' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY' }
      }
    ]
  };
  const runtimeConfig = clone({
    ...oldConfig,
    selectedNodeIndex: 0,
    enable2FA: false,
    allowPasswordUpdate: true,
    rtlConfFilePath: tempDir,
    rtlPass: 'hashed-password',
    SSO: { rtlSSO: 1, rtlCookiePath: '/cookie-path', logoutRedirectLink: '', cookieValue: 'live-sso-cookie' }
  });
  // The request carries only what the sanitized client can have seen: no cookieValue.
  // The server must re-attach it — a settings save must never wipe the live cookie —
  // while keeping it out of both the response and the persisted file.
  const requestBody = {
    ...clone(oldConfig),
    selectedNodeIndex: 0,
    enable2FA: false,
    allowPasswordUpdate: true,
    SSO: { rtlSSO: 1, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' }
  };

  try {
    Common.appConfig = clone(runtimeConfig);
    Common.nodes = clone(runtimeConfig.nodes);
    Common.selectedNode = Common.nodes[0];
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
    assert.equal(Common.appConfig.SSO.cookieValue, 'live-sso-cookie');
    assert.equal(Common.appConfig.SSO.rtlCookiePath, '/cookie-path');
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.equal(fileConfig.SSO.cookieValue, undefined);
    assert.equal(responseBody.SSO.cookieValue, undefined);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings restores omitted secret2FA and merges a trimmed SSO object', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-secrets-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: 'https://logout.example' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/lnd/admin' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY' }
      }
    ]
  };
  const runtimeConfig = clone({
    ...oldConfig,
    selectedNodeIndex: 0,
    enable2FA: true,
    allowPasswordUpdate: true,
    rtlConfFilePath: tempDir,
    rtlPass: 'hashed-password',
    secret2FA: 'live-totp-seed',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: 'https://logout.example', cookieValue: 'live-sso-cookie' }
  });
  // Sanitized responses carry neither secret2FA nor cookieValue, so an echoing client
  // omits both; a trimmed SSO object also lacks logoutRedirectLink. All three must
  // survive the save server-side.
  const requestBody = {
    ...clone(oldConfig),
    selectedNodeIndex: 0,
    enable2FA: true,
    allowPasswordUpdate: true,
    SSO: { rtlSSO: 0 }
  };

  try {
    Common.appConfig = clone(runtimeConfig);
    Common.nodes = clone(runtimeConfig.nodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');

    let responseStatus;
    updateApplicationSettings(
      { body: clone(requestBody), session: { selectedNode: Common.selectedNode } },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(Common.appConfig.secret2FA, 'live-totp-seed');
    assert.equal(Common.appConfig.enable2FA, true);
    assert.equal(Common.appConfig.SSO.cookieValue, 'live-sso-cookie');
    assert.equal(Common.appConfig.SSO.logoutRedirectLink, 'https://logout.example');
    assert.equal(Common.appConfig.SSO.rtlSSO, 0);
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.equal(fileConfig.SSO.cookieValue, undefined);
    assert.equal(fileConfig.secret2FA, 'live-totp-seed');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings tolerates a request body without an SSO object', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-nosso-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/lnd/admin' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY' }
      }
    ]
  };
  const requestBody = clone(oldConfig);
  delete requestBody.SSO;

  try {
    Common.appConfig = clone({
      ...oldConfig,
      selectedNodeIndex: 0,
      rtlConfFilePath: tempDir,
      rtlPass: 'hashed-password',
      SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' }
    });
    Common.nodes = clone(oldConfig.nodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');

    let responseStatus;
    updateApplicationSettings(
      { body: requestBody, session: { selectedNode: Common.selectedNode } },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(typeof Common.appConfig.SSO, 'object');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings leaves the runtime config untouched when the file write fails', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-writefail-'));
  const confPath = join(tempDir, 'RTL-Config.json');
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/lnd/admin' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY' }
      }
    ]
  };
  const runtimeConfig = clone({
    ...oldConfig,
    selectedNodeIndex: 0,
    rtlConfFilePath: tempDir,
    rtlPass: 'hashed-password',
    secret2FA: 'live-totp-seed',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '', cookieValue: 'live-sso-cookie' }
  });
  const requestBody = {
    ...clone(oldConfig),
    selectedNodeIndex: 0,
    SSO: { rtlSSO: 0 },
    nodes: [{ ...clone(oldConfig.nodes[0]), settings: { themeMode: 'NIGHT' } }]
  };

  try {
    Common.appConfig = clone(runtimeConfig);
    Common.nodes = clone(runtimeConfig.nodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(confPath, JSON.stringify(oldConfig, null, 2), 'utf-8');
    chmodSync(tempDir, 0o555); // read-only dir: temp-file create and rename both fail

    let responseStatus = null;
    updateApplicationSettings(
      { body: clone(requestBody), session: { selectedNode: Common.selectedNode } },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 500);
    // The failed write must not have committed the prospective config in memory either.
    assert.equal(Common.appConfig.secret2FA, 'live-totp-seed');
    assert.equal(Common.appConfig.SSO.cookieValue, 'live-sso-cookie');
    assert.equal(Common.appConfig.nodes[0].settings.themeMode, 'DAY');
    // And the on-disk file still parses as the pre-call config.
    const onDisk = JSON.parse(readFileSync(confPath, 'utf-8'));
    assert.equal(onDisk.nodes.length, 1);
  } finally {
    clearInterval(WSServer.pingInterval);
    chmodSync(tempDir, 0o755);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('getFile contains caller paths to the channel backup directory', async () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-getfile-'));
  const backupDir = join(tempDir, 'backups');
  mkdirSync(backupDir);
  writeFileSync(join(tempDir, 'secret.bak'), 'top-secret', 'utf-8');
  writeFileSync(join(backupDir, 'channel-1x2x3.bak'), 'backup-data', 'utf-8');
  const session = { selectedNode: { lnImplementation: 'LND', settings: { channelBackupPath: backupDir } } };
  const mockRes = () => {
    const res = { statusCode: null, body: null };
    res.status = (code) => {
      res.statusCode = code;
      return { json: (body) => { res.body = body; } };
    };
    return res;
  };

  try {
    // An escaping path is rejected before any read.
    const rejected = mockRes();
    getFile({ query: { path: join(tempDir, 'secret.bak') }, session }, rejected, null);
    assert.equal(rejected.statusCode, 403);

    // A contained path is served.
    const served = mockRes();
    await new Promise((resolve) => {
      const res = { status: (code) => { served.statusCode = code; return { json: (body) => { served.body = body; resolve(); } }; } };
      getFile({ query: { path: join(backupDir, 'channel-1x2x3.bak') }, session }, res, null);
    });
    assert.equal(served.statusCode, 200);
    assert.equal(served.body, 'backup-data');

    // A contained but missing file returns a path-free error (the ENOENT branch).
    const missing = mockRes();
    await new Promise((resolve) => {
      const res = { status: (code) => { missing.statusCode = code; return { json: (body) => { missing.body = body; resolve(); } }; } };
      getFile({ query: { path: join(backupDir, 'channel-missing.bak') }, session }, res, null);
    });
    assert.equal(missing.statusCode, 500);
    assert.equal(JSON.stringify(missing.body).includes(backupDir), false);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

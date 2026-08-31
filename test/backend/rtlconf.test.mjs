import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import test from 'node:test';

import { updateApplicationSettings, updateNodeSettings, getFile } from '../../backend/controllers/shared/RTLConf.js';
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
        authentication: { runePath: '/cln/rune', swapMacaroonPath: '/loop/cln' },
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
    // Node index 5 is unknown to the server, so it is dropped rather than provisioned;
    // only the known indexes survive in the runtime config and the file.
    assert.deepEqual(Common.appConfig.nodes.map((node) => node.index), [0, 2]);

    const runtimeClnNode = Common.appConfig.nodes[1];
    assert.equal(runtimeClnNode.authentication.runePath, '/cln/rune');
    assert.equal(runtimeClnNode.authentication.macaroonPath, undefined);
    assert.equal(runtimeClnNode.authentication.runeValue, 'runtime-rune');
    assert.deepEqual(runtimeClnNode.authentication.options, { headers: { rune: 'runtime-rune' } });
    assert.equal(runtimeClnNode.authentication.swapMacaroonPath, '/loop/cln');
    assert.equal(runtimeClnNode.settings.themeMode, 'DAY');
    assert.equal(runtimeClnNode.settings.blockExplorerUrl, 'https://old.example');

    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.deepEqual(fileConfig.nodes.map((node) => node.index), [0, 2]);
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
    // Both write paths must fail: a read-only dir defeats the temp-file write, and a
    // read-only file defeats the in-place fallback.
    chmodSync(confPath, 0o444);
    chmodSync(tempDir, 0o555);

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
    chmodSync(confPath, 0o644);
    chmodSync(tempDir, 0o755);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings preserves the config file mode across the atomic write', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-mode-'));
  const confPath = join(tempDir, 'RTL-Config.json');
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
    writeFileSync(confPath, JSON.stringify(oldConfig, null, 2), 'utf-8');
    chmodSync(confPath, 0o600); // operator-hardened; must not be silently downgraded

    let responseStatus = null;
    updateApplicationSettings(
      { body: clone(oldConfig), session: { selectedNode: Common.selectedNode } },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(statSync(confPath).mode & 0o777, 0o600);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings falls back to an in-place write when the rename fails', () => {
  // Single-file bind mounts and symlinks cannot be renamed over; the save must still work.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-fallback-'));
  const confPath = join(tempDir, 'RTL-Config.json');
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
    writeFileSync(confPath, JSON.stringify(oldConfig, null, 2), 'utf-8');
    chmodSync(confPath, 0o600);
    mkdirSync(confPath + '.tmp'); // forces the temp write to fail, exercising the fallback

    let responseStatus = null;
    updateApplicationSettings(
      { body: clone(oldConfig), session: { selectedNode: Common.selectedNode } },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(statSync(confPath).mode & 0o777, 0o600); // in-place write keeps the inode
    assert.deepEqual(JSON.parse(readFileSync(confPath, 'utf-8')).nodes.length, 1);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings strips untrusted credential paths and un-allowlisted payload fields', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-allowlist-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/server/lnd/admin', configPath: '', swapMacaroonPath: '/server/loop', boltzMacaroonPath: '/server/boltz' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY', lnServerUrl: 'https://server:8080', swapServerUrl: 'https://swap:8081', boltzServerUrl: 'https://boltz:9003', bitcoindConfigPath: '/server/bitcoin.conf', channelBackupPath: '/server/backups' }
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
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '', cookieValue: 'live-sso-cookie' },
    nodes: [
      {
        ...oldConfig.nodes[0],
        authentication: {
          ...oldConfig.nodes[0].authentication,
          options: { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } }
        }
      }
    ]
  });
  // An attacker with an authenticated session attempts to re-point credential paths and
  // server URLs on the existing node, inject runtime-only auth state, smuggle an unknown
  // setting, stash a root-level macaroonPath, and provision a brand-new node carrying its
  // own credential paths.
  const requestBody = {
    ...clone(oldConfig),
    selectedNodeIndex: 0,
    enable2FA: false,
    allowPasswordUpdate: true,
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        macaroonPath: '/etc/shadow',
        authentication: { macaroonPath: '/evil/lnd', runePath: '/evil/rune', lnApiPassword: 'evil-pass', configPath: '/etc/passwd', runeValue: 'evil-rune', macaroonValue: 'evil-macaroon', options: { headers: { 'Grpc-Metadata-macaroon': 'evil' } }, swapMacaroonPath: '/evil/loop', boltzMacaroonPath: '/evil/boltz' },
        settings: { themeMode: 'NIGHT', logFile: '/tmp/evil.log', lnServerUrl: 'https://evil.example', swapServerUrl: 'https://evil.swap', boltzServerUrl: 'https://evil.boltz', bitcoindConfigPath: '/etc/shadow', channelBackupPath: '/tmp/evil', evilSetting: 'smuggled' }
      },
      {
        index: 5,
        lnNode: 'new-lnd',
        lnImplementation: 'LND',
        macaroonPath: '/etc/passwd',
        authentication: { macaroonPath: '/evil/new', runePath: '/evil/rune', lnApiPassword: 'evil-pass', configPath: '/etc/passwd' },
        settings: { themeMode: 'DAY', lnServerUrl: 'https://new.example' }
      }
    ]
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
    const existingNode = Common.appConfig.nodes[0];
    assert.equal(existingNode.authentication.macaroonPath, '/server/lnd/admin');
    assert.equal(existingNode.authentication.configPath, '');
    assert.equal(existingNode.authentication.runePath, undefined);
    assert.equal(existingNode.authentication.lnApiPassword, undefined);
    assert.equal(existingNode.authentication.runeValue, undefined);
    assert.equal(existingNode.authentication.macaroonValue, undefined);
    assert.equal(existingNode.macaroonPath, undefined);
    // The swap/boltz macaroon paths are read from disk and sent as auth headers, so the
    // attacker-supplied ones are pinned back to the server-held values.
    assert.equal(existingNode.authentication.swapMacaroonPath, '/server/loop');
    assert.equal(existingNode.authentication.boltzMacaroonPath, '/server/boltz');
    // Runtime-only auth state carried by the pre-existing node survives the save.
    assert.deepEqual(existingNode.authentication.options, { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } });
    assert.equal(existingNode.settings.lnServerUrl, 'https://server:8080');
    assert.equal(existingNode.settings.swapServerUrl, 'https://swap:8081');
    assert.equal(existingNode.settings.boltzServerUrl, 'https://boltz:9003');
    assert.equal(existingNode.settings.bitcoindConfigPath, '/server/bitcoin.conf');
    assert.equal(existingNode.settings.channelBackupPath, '/server/backups');
    assert.equal(existingNode.settings.themeMode, 'NIGHT');
    assert.equal(existingNode.settings.evilSetting, undefined);
    // logFile is not accepted: config.ts rewrites it unconditionally at boot.
    assert.equal(existingNode.settings.logFile, undefined);
    // The unknown-index node is dropped rather than provisioned; nothing about it
    // survives anywhere.
    assert.deepEqual(Common.appConfig.nodes.map((node) => node.index), [0]);

    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.deepEqual(fileConfig.nodes.map((node) => node.index), [0]);
    assert.equal(fileConfig.nodes[0].authentication.macaroonPath, '/server/lnd/admin');
    assert.equal(fileConfig.nodes[0].authentication.options, undefined);
    assert.equal(fileConfig.nodes[0].authentication.runeValue, undefined);
    assert.equal(fileConfig.nodes[0].authentication.swapMacaroonPath, '/server/loop');
    assert.equal(fileConfig.nodes[0].settings.lnServerUrl, 'https://server:8080');
    assert.equal(fileConfig.nodes[0].settings.themeMode, 'NIGHT');
    assert.equal(fileConfig.nodes[0].settings.evilSetting, undefined);
    assert.equal(fileConfig.nodes[0].macaroonPath, undefined);
    assert.equal(responseBody.nodes[0].authentication.macaroonPath, undefined);
    assert.equal(responseBody.nodes[0].macaroonPath, undefined);
    assert.equal(responseBody.nodes[0].settings.lnServerUrl, 'https://server:8080');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings normalizes string node indexes when merging', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-index-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/server/lnd/admin' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY', lnServerUrl: 'https://server:8080' }
      },
      {
        index: 2,
        lnNode: 'cln-secondary',
        lnImplementation: 'CLN',
        authentication: { runePath: '/cln/rune' },
        settings: { userPersona: 'MERCHANT', themeMode: 'NIGHT', lnServerUrl: 'https://cln:8080' }
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
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '', cookieValue: 'live-sso-cookie' }
  });
  // JSON payloads carry indexes as strings; "2" must merge into the existing node 2, not
  // be appended as a brand-new node.
  const requestBody = {
    ...clone(oldConfig),
    selectedNodeIndex: 0,
    enable2FA: false,
    allowPasswordUpdate: true,
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      {
        index: '2',
        lnNode: 'cln-secondary',
        lnImplementation: 'CLN',
        authentication: {},
        settings: { themeMode: 'DAY' }
      }
    ]
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
    assert.deepEqual(Common.appConfig.nodes.map((node) => node.index), [0, 2]);
    const clnNode = Common.appConfig.nodes[1];
    assert.equal(clnNode.index, 2);
    assert.equal(clnNode.settings.themeMode, 'DAY');
    assert.equal(clnNode.settings.lnServerUrl, 'https://cln:8080');
    assert.equal(clnNode.authentication.runePath, '/cln/rune');
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.deepEqual(fileConfig.nodes.map((node) => node.index), [0, 2]);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings drops unknown-index nodes instead of provisioning them', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-url-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/server/lnd/admin' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY', lnServerUrl: 'https://server:8080' }
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
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '', cookieValue: 'live-sso-cookie' }
  });
  const requestBody = {
    ...clone(oldConfig),
    selectedNodeIndex: 0,
    enable2FA: false,
    allowPasswordUpdate: true,
    SSO: { rtlSSO: 0, rtlCookiePath: '/cookie-path', logoutRedirectLink: '' },
    nodes: [
      { index: 0, lnNode: 'lnd-main', lnImplementation: 'LND', authentication: {}, settings: { themeMode: 'DAY' } },
      {
        index: 9,
        lnNode: 'rogue-node',
        lnImplementation: 'LND',
        macaroonPath: '/etc/shadow',
        authentication: { macaroonPath: '/evil/lnd', swapMacaroonPath: '/evil/loop', configPath: '/etc/passwd' },
        settings: { lnServerUrl: 'https://evil.example', bitcoindConfigPath: '/etc/shadow', channelBackupPath: '/tmp/evil', logFile: '/tmp/evil.log', themeMode: 'DAY' }
      }
    ]
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

    // The unknown node is dropped rather than provisioned — a caller-chosen credential
    // path or server URL would otherwise be persisted and loaded back into the runtime
    // nodes at the next restart — and the save itself still succeeds.
    assert.equal(responseStatus, 201);
    assert.deepEqual(Common.appConfig.nodes.map((node) => node.index), [0]);
    assert.deepEqual(responseBody.nodes.map((node) => node.index), [0]);
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.deepEqual(fileConfig.nodes.map((node) => node.index), [0]);
    assert.equal(fileConfig.nodes.some((node) => JSON.stringify(node).includes('evil')), false);
    assert.equal(Common.appConfig.nodes[0].settings.themeMode, 'DAY');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateNodeSettings pins channelBackupPath to the server-held value', () => {
  // channelBackupPath anchors getFile's containment root; accepting it from the request
  // would let the caller being contained choose the containment base.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-nodesettings-'));
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
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY', channelBackupPath: '/server/backups' }
      }
    ]
  };

  try {
    Common.appConfig = clone({ ...oldConfig, rtlConfFilePath: tempDir });
    Common.nodes = clone(oldConfig.nodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');

    let responseStatus = null;
    updateNodeSettings(
      {
        body: { settings: { themeMode: 'NIGHT', channelBackupPath: tempDir } },
        session: { selectedNode: Common.nodes[0] }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    const fileNode = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8')).nodes[0];
    assert.equal(fileNode.settings.channelBackupPath, '/server/backups');
    assert.equal(fileNode.settings.themeMode, 'NIGHT'); // other settings still merge
    assert.equal(Common.nodes[0].settings.channelBackupPath, '/server/backups');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateNodeSettings allowlists settings, applies valid service URLs and pins LN credential anchors', () => {
  // lnServerUrl, bitcoindConfigPath and channelBackupPath are not in the node-settings
  // allowlist — they must be silently dropped from the request. swapServerUrl and
  // boltzServerUrl are legitimately edited here (the node-config Services page sends
  // them), so valid http(s) values are applied; malformed or non-HTTP values are dropped
  // by the same format validation the application-settings endpoint uses.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-nodesettings-allowlist-'));
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
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY', lnServerUrl: 'https://server:8080', swapServerUrl: 'https://swap:8081', boltzServerUrl: 'https://boltz:9003', bitcoindConfigPath: '/server/bitcoin.conf', channelBackupPath: '/server/backups' }
      }
    ]
  };

  try {
    Common.appConfig = clone({ ...oldConfig, rtlConfFilePath: tempDir });
    Common.nodes = clone(oldConfig.nodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');

    let responseStatus = null;
    updateNodeSettings(
      {
        body: { settings: { themeMode: 'NIGHT', lnServerUrl: 'https://evil.example', swapServerUrl: 'https://evil.swap', boltzServerUrl: 'https://evil.boltz', bitcoindConfigPath: '/etc/shadow', channelBackupPath: '/tmp/evil' } },
        session: { selectedNode: Common.nodes[0] }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    const fileNode = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8')).nodes[0];
    assert.equal(fileNode.settings.themeMode, 'NIGHT');
    assert.equal(fileNode.settings.lnServerUrl, 'https://server:8080');
    // Valid service URLs are applied.
    assert.equal(fileNode.settings.swapServerUrl, 'https://evil.swap');
    assert.equal(fileNode.settings.boltzServerUrl, 'https://evil.boltz');
    assert.equal(fileNode.settings.bitcoindConfigPath, '/server/bitcoin.conf');
    assert.equal(fileNode.settings.channelBackupPath, '/server/backups');
    assert.equal(Common.nodes[0].settings.themeMode, 'NIGHT');
    assert.equal(Common.nodes[0].settings.lnServerUrl, 'https://server:8080');

    // Malformed or non-HTTP service URLs are dropped, keeping the previously applied value.
    updateNodeSettings(
      {
        body: { settings: { swapServerUrl: 'not-a-url', boltzServerUrl: 'file:///etc/passwd' } },
        session: { selectedNode: Common.nodes[0] }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );
    assert.equal(responseStatus, 201);
    const fileNodeAfterInvalid = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8')).nodes[0];
    assert.equal(fileNodeAfterInvalid.settings.swapServerUrl, 'https://evil.swap');
    assert.equal(fileNodeAfterInvalid.settings.boltzServerUrl, 'https://evil.boltz');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings validates blockExplorerUrl format and rejects malformed values', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-blockexplorer-'));
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
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY', blockExplorerUrl: 'https://mempool.space', swapServerUrl: 'https://swap:8081', boltzServerUrl: 'https://boltz:9003' }
      }
    ]
  };

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
      {
        body: { ...clone(oldConfig), selectedNodeIndex: 0, nodes: [{ index: 0, settings: { blockExplorerUrl: 'not-a-url', themeMode: 'NIGHT' } }] },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    // The malformed URL is rejected; the server-held value is preserved.
    assert.equal(Common.appConfig.nodes[0].settings.blockExplorerUrl, 'https://mempool.space');
    // Other settings still merge.
    assert.equal(Common.appConfig.nodes[0].settings.themeMode, 'NIGHT');

    // Now test a valid URL is accepted.
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');
    Common.appConfig = clone({
      ...oldConfig,
      selectedNodeIndex: 0,
      rtlConfFilePath: tempDir,
      rtlPass: 'hashed-password',
      SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' }
    });
    Common.nodes = clone(oldConfig.nodes);
    Common.selectedNode = Common.nodes[0];

    updateApplicationSettings(
      {
        body: { ...clone(oldConfig), selectedNodeIndex: 0, nodes: [{ index: 0, settings: { blockExplorerUrl: 'https://mempool.example', themeMode: 'DAY' } }] },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(Common.appConfig.nodes[0].settings.blockExplorerUrl, 'https://mempool.example');
    // Service URLs are not accepted on the application-settings endpoint; they are pinned
    // back to the server-held values.
    assert.equal(Common.appConfig.nodes[0].settings.swapServerUrl, 'https://swap:8081');
    assert.equal(Common.appConfig.nodes[0].settings.boltzServerUrl, 'https://boltz:9003');

    // A parseable but non-HTTP scheme (file:///etc/passwd) is rejected too — it would
    // otherwise be persisted and re-loaded into the runtime config, or copied into the
    // outbound request built from the live node's settings.
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');
    Common.appConfig = clone({
      ...oldConfig,
      selectedNodeIndex: 0,
      rtlConfFilePath: tempDir,
      rtlPass: 'hashed-password',
      SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' }
    });
    Common.nodes = clone(oldConfig.nodes);
    Common.selectedNode = Common.nodes[0];

    updateApplicationSettings(
      {
        body: { ...clone(oldConfig), selectedNodeIndex: 0, nodes: [{ index: 0, settings: { blockExplorerUrl: 'file:///etc/passwd', swapServerUrl: 'https://evil.swap', boltzServerUrl: 'https://evil.boltz', themeMode: 'DAY' } }] },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(Common.appConfig.nodes[0].settings.blockExplorerUrl, 'https://mempool.space');
    assert.equal(Common.appConfig.nodes[0].settings.swapServerUrl, 'https://swap:8081');
    assert.equal(Common.appConfig.nodes[0].settings.boltzServerUrl, 'https://boltz:9003');
    assert.equal(Common.appConfig.nodes[0].settings.themeMode, 'DAY');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings filters unknown top-level payload keys', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-toplevel-'));
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

    let responseStatus = null;
    updateApplicationSettings(
      {
        body: { ...clone(oldConfig), evilTopLevel: 'injected', dbDirectoryPath: '/etc/shadow', selectedNodeIndex: 0 },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(Common.appConfig.evilTopLevel, undefined);
    assert.equal(Common.appConfig.dbDirectoryPath, '/db');
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.equal(fileConfig.evilTopLevel, undefined);
    assert.equal(fileConfig.dbDirectoryPath, '/db');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings preserves runtime-only auth state when all payload nodes are dropped', () => {
  // When every payload node has an unknown index, config.nodes is empty and the rebuild
  // block must still use the server-held node list — not the stale on-disk copy — so
  // runtime-only fields (options, runeValue) survive.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-empty-nodes-'));
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
  const runtimeConfig = clone({
    ...oldConfig,
    selectedNodeIndex: 0,
    enable2FA: false,
    allowPasswordUpdate: true,
    rtlConfFilePath: tempDir,
    rtlPass: 'hashed-password',
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' },
    nodes: [
      {
        ...oldConfig.nodes[0],
        authentication: {
          ...oldConfig.nodes[0].authentication,
          options: { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } }
        }
      }
    ]
  });

  try {
    Common.appConfig = clone(runtimeConfig);
    Common.nodes = clone(runtimeConfig.nodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');

    let responseStatus = null;
    updateApplicationSettings(
      {
        body: { ...clone(oldConfig), selectedNodeIndex: 0, nodes: [{ index: 9, lnNode: 'rogue', lnImplementation: 'LND', settings: { themeMode: 'NIGHT' } }] },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    // The unknown node was dropped; the existing node's runtime-only auth state survives.
    assert.deepEqual(Common.appConfig.nodes.map((n) => n.index), [0]);
    assert.deepEqual(Common.appConfig.nodes[0].authentication.options, { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } });
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings drops a caller-supplied multiPass', () => {
  // The plaintext password is hashed into multiPassHashed at boot and never sent back to
  // the client (getApplicationSettings serves the file masked), so a multiPass arriving in
  // the request body can only be attacker-supplied. It is rejected at the allowlist and
  // must not be persisted to RTL-Config.json.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-multipass-'));
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

    let responseStatus = null;
    updateApplicationSettings(
      {
        body: { ...clone(oldConfig), selectedNodeIndex: 0, multiPass: 'attacker-password' },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(Common.appConfig.multiPass, undefined);
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.equal(fileConfig.multiPass, undefined);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings rebuilds and filters against the runtime node list (common.nodes), not the stale on-disk copy', () => {
  // F12: both known-vs-unknown and the node rebuild — the two sides of the same decision —
  // resolve against common.nodes, the single authoritative runtime list (addSecureData
  // pins from it; updateNodeSettings mutates it in place). If the controller resolved
  // against common.appConfig.nodes — a fresh clone at every save that can go stale — a
  // settings edit made through the node-settings endpoint (swapServerUrl below) would be
  // silently reverted to the stale on-disk value, and a runtime node could be dropped as
  // unknown. Here the on-disk file (and the stale appConfig copy) predate the runtime
  // state; the edit must survive the application-settings save.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-runtime-nodes-'));
  const staleFile = {
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
  const runtimeNodes = clone(staleFile.nodes);
  runtimeNodes[0].settings.swapServerUrl = 'https://swap:8081';
  runtimeNodes[0].settings.themeMode = 'NIGHT';
  runtimeNodes[0].authentication.options = { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } };

  try {
    Common.appConfig = clone({
      ...staleFile,
      selectedNodeIndex: 0,
      rtlConfFilePath: tempDir,
      rtlPass: 'hashed-password',
      SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' }
    });
    Common.nodes = clone(runtimeNodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(staleFile, null, 2), 'utf-8');

    let responseStatus = null;
    updateApplicationSettings(
      {
        body: { ...clone(staleFile), selectedNodeIndex: 0, nodes: [{ index: 0, settings: { themeMode: 'DAY' } }, { index: 9, lnNode: 'rogue', lnImplementation: 'LND', settings: { themeMode: 'NIGHT' } }] },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    // The unknown node is dropped and only node 0 remains.
    assert.deepEqual(Common.appConfig.nodes.map((n) => n.index), [0]);
    // The runtime-only service URL edit made via updateNodeSettings survives the rebuild.
    assert.equal(Common.appConfig.nodes[0].settings.swapServerUrl, 'https://swap:8081');
    // Runtime-only auth state survives too.
    assert.deepEqual(Common.appConfig.nodes[0].authentication.options, { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } });
    // The payload edit is applied.
    assert.equal(Common.appConfig.nodes[0].settings.themeMode, 'DAY');
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings drops invalid defaultNodeIndex and selectedNodeIndex values', () => {
  // Both scalars pass TOP_LEVEL_ALLOWLIST, but they must carry the same known-index
  // discipline as nodes[]: defaultNodeIndex is persisted (unlike selectedNodeIndex it is
  // not stripped from the file config), so a body value that is unknown (999) or
  // unparseable ('abc') would survive a restart. They are dropped and the server-held
  // values win.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-index-scalars-'));
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

    let responseStatus = null;
    updateApplicationSettings(
      {
        body: { ...clone(oldConfig), defaultNodeIndex: 999, selectedNodeIndex: 'abc' },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    assert.equal(Common.appConfig.defaultNodeIndex, 0);
    assert.equal(Common.appConfig.selectedNodeIndex, 0);
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.equal(fileConfig.defaultNodeIndex, 0);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings does not silently discard the payload when the runtime node list is empty', () => {
  // The node rebuild is guarded on common.nodes being non-empty. If it is empty (cannot
  // happen after a normal boot — common.nodes is built from the file at boot — but the
  // guard must not be silent), the allowlisted-and-pinned payload must become the saved
  // nodes instead of the unmodified on-disk copy pretending a save happened.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-empty-runtime-'));
  const staleFile = {
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

  try {
    Common.appConfig = clone({
      ...staleFile,
      selectedNodeIndex: 0,
      rtlConfFilePath: tempDir,
      rtlPass: 'hashed-password',
      SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' }
    });
    Common.nodes = [];
    Common.selectedNode = null;
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(staleFile, null, 2), 'utf-8');

    let responseStatus = null;
    updateApplicationSettings(
      {
        body: { ...clone(staleFile), selectedNodeIndex: 0, nodes: [{ index: 9, lnNode: 'rogue', lnImplementation: 'LND', settings: { themeMode: 'NIGHT' } }] },
        session: { selectedNode: null }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    // With no known runtime nodes, nothing is known; the payload node (index 9) is dropped
    // and the save records exactly that instead of keeping the stale on-disk node.
    assert.deepEqual(Common.appConfig.nodes, []);
    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.deepEqual(fileConfig.nodes, []);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateApplicationSettings treats empty, null, boolean and array indexes as unknown and drops them', () => {
  // indexKey rejects anything that is not a number or a non-blank numeric string. Under a
  // naive +val coercion ''/false/[]/null would all become 0 — a real node — and would
  // merge into (and REWRITE) the operator's node as 'empty-index'/'bool-index'/etc.; they
  // must instead be dropped as unknown. 'abc' → NaN → not finite → dropped too.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-nan-index-'));
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

    let responseStatus = null;
    updateApplicationSettings(
      {
        body: {
          ...clone(oldConfig),
          selectedNodeIndex: 0,
          nodes: [
            { index: null, lnNode: 'null-index', settings: { themeMode: 'NIGHT' } },
            { index: '', lnNode: 'empty-index', settings: { themeMode: 'NIGHT' } },
            { index: false, lnNode: 'bool-index', settings: { themeMode: 'NIGHT' } },
            { index: [], lnNode: 'array-index', settings: { themeMode: 'NIGHT' } },
            { index: 'abc', lnNode: 'non-numeric-index', settings: { themeMode: 'NIGHT' } }
          ]
        },
        session: { selectedNode: Common.selectedNode }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    // None of the coerced-to-0 candidates may merge with the real node 0.
    assert.equal(Common.appConfig.nodes.length, 1);
    assert.equal(Common.appConfig.nodes[0].index, 0);
    assert.equal(Common.appConfig.nodes[0].lnNode, 'lnd-main');
    assert.deepEqual(Common.appConfig.nodes.map((n) => n.index), [0]);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

test('updateNodeSettings applies Loop/Boltz service macaroon paths but never the LN credential paths', () => {
  // The node-config Services page edits the swap and Boltz macaroon paths through this
  // endpoint (the client holds them — removeSecureData keeps them), so they are applied;
  // an empty value clears the field. The LN credential anchors (macaroonPath, runePath,
  // lnApiPassword, configPath) have no writable path through any endpoint and must stay
  // pinned to the server value.
  const tempDir = mkdtempSync(join(tmpdir(), 'rtlconf-nodesettings-auth-'));
  const oldConfig = {
    defaultNodeIndex: 0,
    dbDirectoryPath: '/db',
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '' },
    nodes: [
      {
        index: 0,
        lnNode: 'lnd-main',
        lnImplementation: 'LND',
        authentication: { macaroonPath: '/lnd/admin', swapMacaroonPath: '/server/loop', boltzMacaroonPath: '/server/boltz' },
        settings: { userPersona: 'OPERATOR', themeMode: 'DAY' }
      }
    ]
  };

  try {
    Common.appConfig = clone({ ...oldConfig, rtlConfFilePath: tempDir });
    Common.nodes = clone(oldConfig.nodes);
    Common.selectedNode = Common.nodes[0];
    writeFileSync(join(tempDir, 'RTL-Config.json'), JSON.stringify(oldConfig, null, 2), 'utf-8');

    let responseStatus = null;
    updateNodeSettings(
      {
        body: { settings: { themeMode: 'NIGHT' }, authentication: { swapMacaroonPath: '/evil/loop', boltzMacaroonPath: '/evil/boltz', macaroonPath: '/evil/lnd', configPath: '/etc/passwd' } },
        session: { selectedNode: Common.nodes[0] }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );

    assert.equal(responseStatus, 201);
    const fileNode = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8')).nodes[0];
    assert.equal(fileNode.settings.themeMode, 'NIGHT');
    // The service macaroon paths are applied from the request body.
    assert.equal(fileNode.authentication.swapMacaroonPath, '/evil/loop');
    assert.equal(fileNode.authentication.boltzMacaroonPath, '/evil/boltz');
    // The LN credential paths are untouched.
    assert.equal(fileNode.authentication.macaroonPath, '/lnd/admin');
    assert.equal(fileNode.authentication.configPath, undefined);

    // An empty service path clears the field.
    updateNodeSettings(
      {
        body: { authentication: { swapMacaroonPath: '', boltzMacaroonPath: '' } },
        session: { selectedNode: Common.nodes[0] }
      },
      {
        status: (status) => {
          responseStatus = status;
          return { json: () => {} };
        }
      },
      null
    );
    assert.equal(responseStatus, 201);
    const clearedNode = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8')).nodes[0];
    assert.equal(clearedNode.authentication.swapMacaroonPath, undefined);
    assert.equal(clearedNode.authentication.boltzMacaroonPath, undefined);
    assert.equal(clearedNode.authentication.macaroonPath, '/lnd/admin');
  } finally {
    clearInterval(WSServer.pingInterval);
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

    // The channel branch derives the backup file name from the channel value.
    const channelServed = mockRes();
    await new Promise((resolve) => {
      const res = { status: (code) => { channelServed.statusCode = code; return { json: (body) => { channelServed.body = body; resolve(); } }; } };
      getFile({ query: { channel: '1x2x3' }, session }, res, null);
    });
    assert.equal(channelServed.statusCode, 200);
    assert.equal(channelServed.body, 'backup-data');

    // A channel carrying path separators would otherwise concatenate into an escaping file
    // name (secret.bak lives outside the backup dir); the sanitizer neutralizes them, so
    // the read stays contained and fails on the missing file rather than serving the
    // out-of-tree contents.
    const channelTraversal = mockRes();
    await new Promise((resolve) => {
      const res = { status: (code) => { channelTraversal.statusCode = code; return { json: (body) => { channelTraversal.body = body; resolve(); } }; } };
      getFile({ query: { channel: '../secret' }, session }, res, null);
    });
    assert.equal(channelTraversal.statusCode, 500);
    assert.equal(JSON.stringify(channelTraversal.body).includes('top-secret'), false);
  } finally {
    clearInterval(WSServer.pingInterval);
    rmSync(tempDir, { force: true, recursive: true });
  }
});

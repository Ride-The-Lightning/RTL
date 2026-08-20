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
        authentication: { macaroonPath: '/server/lnd/admin', configPath: '' },
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
        authentication: { macaroonPath: '/evil/lnd', runePath: '/evil/rune', lnApiPassword: 'evil-pass', configPath: '/etc/passwd', runeValue: 'evil-rune', macaroonValue: 'evil-macaroon', options: { headers: { 'Grpc-Metadata-macaroon': 'evil' } } },
        settings: { themeMode: 'NIGHT', lnServerUrl: 'https://evil.example', swapServerUrl: 'https://evil.swap', boltzServerUrl: 'https://evil.boltz', bitcoindConfigPath: '/etc/shadow', channelBackupPath: '/tmp/evil', evilSetting: 'smuggled' }
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
    // Runtime-only auth state carried by the pre-existing node survives the save.
    assert.deepEqual(existingNode.authentication.options, { headers: { 'Grpc-Metadata-macaroon': 'runtime-lnd-macaroon' } });
    assert.equal(existingNode.settings.lnServerUrl, 'https://server:8080');
    assert.equal(existingNode.settings.swapServerUrl, 'https://swap:8081');
    assert.equal(existingNode.settings.boltzServerUrl, 'https://boltz:9003');
    assert.equal(existingNode.settings.bitcoindConfigPath, '/server/bitcoin.conf');
    assert.equal(existingNode.settings.channelBackupPath, '/server/backups');
    assert.equal(existingNode.settings.themeMode, 'NIGHT');
    assert.equal(existingNode.settings.evilSetting, undefined);
    const newNode = Common.appConfig.nodes[1];
    assert.equal(newNode.index, 5);
    assert.equal(newNode.authentication.macaroonPath, undefined);
    assert.equal(newNode.authentication.runePath, undefined);
    assert.equal(newNode.authentication.lnApiPassword, undefined);
    assert.equal(newNode.authentication.configPath, undefined);
    assert.equal(newNode.macaroonPath, undefined);
    assert.equal(newNode.settings.lnServerUrl, 'https://new.example');
    assert.equal(newNode.settings.themeMode, 'DAY');

    const fileConfig = JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8'));
    assert.deepEqual(fileConfig.nodes.map((node) => node.index), [0, 5]);
    assert.equal(fileConfig.nodes[0].authentication.macaroonPath, '/server/lnd/admin');
    assert.equal(fileConfig.nodes[0].authentication.options, undefined);
    assert.equal(fileConfig.nodes[0].authentication.runeValue, undefined);
    assert.equal(fileConfig.nodes[0].settings.lnServerUrl, 'https://server:8080');
    assert.equal(fileConfig.nodes[0].settings.themeMode, 'NIGHT');
    assert.equal(fileConfig.nodes[0].settings.evilSetting, undefined);
    assert.equal(fileConfig.nodes[0].macaroonPath, undefined);
    assert.equal(fileConfig.nodes[1].authentication.macaroonPath, undefined);
    assert.equal(fileConfig.nodes[1].macaroonPath, undefined);
    assert.equal(fileConfig.nodes[1].settings.lnServerUrl, 'https://new.example');
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

test('updateApplicationSettings rejects an invalid lnServerUrl on a new node without persisting', () => {
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
      { index: 0, lnNode: 'lnd-main', lnImplementation: 'LND', authentication: {}, settings: {} },
      { index: 9, lnNode: 'rogue-node', lnImplementation: 'LND', authentication: {}, settings: { lnServerUrl: 'not-a-valid-url' } }
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

    assert.equal(responseStatus, 400);
    assert.equal(JSON.stringify(responseBody).includes('Invalid lnServerUrl'), true);
    // The failed validation must not have touched the runtime config or the file.
    assert.deepEqual(Common.appConfig.nodes.map((node) => node.index), [0]);
    assert.equal(JSON.parse(readFileSync(join(tempDir, 'RTL-Config.json'), 'utf-8')).nodes.length, 1);
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

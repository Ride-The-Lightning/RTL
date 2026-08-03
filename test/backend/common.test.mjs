import assert from 'node:assert/strict';
import test from 'node:test';

import { Common } from '../../backend/utils/common.js';

test('maskPasswords masks TOTP and SSO cookie secrets along with passwords', () => {
  const config = {
    secret2FA: 'JBSWY3DPEHPK3PXP',
    multiPassHashed: 'password-hash',
    SSO: { rtlSSO: 1, rtlCookiePath: '/cookie-path', cookieValue: 'live-sso-cookie' },
    nodes: [{ index: 1, authentication: { lnApiPassword: 'eclair-pass', macaroonPath: '/macaroon/path' } }]
  };
  const masked = Common.maskPasswords(config);
  assert.equal(masked.secret2FA, '*'.repeat(20));
  assert.equal(masked.SSO.cookieValue, '*'.repeat(20));
  assert.equal(masked.multiPassHashed, '*'.repeat(20));
  assert.equal(masked.nodes[0].authentication.lnApiPassword, '*'.repeat(20));
  // Paths are configuration, not secrets — they must stay visible for the settings UI.
  assert.equal(masked.nodes[0].authentication.macaroonPath, '/macaroon/path');
  assert.equal(masked.SSO.rtlCookiePath, '/cookie-path');
});

test('removeSecureData strips the SSO cookie along with the other secrets', () => {
  const config = {
    rtlConfFilePath: '/conf',
    rtlPass: 'password-hash',
    multiPassHashed: 'password-hash',
    secret2FA: 'JBSWY3DPEHPK3PXP',
    SSO: { rtlSSO: 1, rtlCookiePath: '/cookie-path', logoutRedirectLink: '', cookieValue: 'live-sso-cookie' },
    nodes: [{ index: 1, authentication: { macaroonPath: '/macaroon/path', runeValue: 'rune', options: {} } }]
  };
  const cleaned = Common.removeSecureData(config);
  assert.equal(cleaned.rtlConfFilePath, undefined);
  assert.equal(cleaned.rtlPass, undefined);
  assert.equal(cleaned.multiPassHashed, undefined);
  assert.equal(cleaned.secret2FA, undefined);
  assert.equal(cleaned.SSO.cookieValue, undefined);
  // Non-secret SSO settings survive — the settings UI renders them.
  assert.equal(cleaned.SSO.rtlCookiePath, '/cookie-path');
  assert.equal(cleaned.nodes[0].authentication.macaroonPath, undefined);
});

test('removeSecureData does not mutate its input', () => {
  // cookieValue is runtime-only: if a caller ever passes the live appConfig, an in-place
  // delete would wipe SSO state with no way to restore it. The function must clone.
  const config = { rtlPass: 'password-hash', SSO: { cookieValue: 'live-sso-cookie' }, nodes: [] };
  Common.removeSecureData(config);
  assert.equal(config.rtlPass, 'password-hash');
  assert.equal(config.SSO.cookieValue, 'live-sso-cookie');
});

test('maskPasswords masks rtlPass and runeValue', () => {
  const config = {
    rtlPass: 'login-hash',
    nodes: [{ index: 1, authentication: { runeValue: 'cln-rune' } }]
  };
  const masked = Common.maskPasswords(config);
  assert.equal(masked.rtlPass, '*'.repeat(20));
  assert.equal(masked.nodes[0].authentication.runeValue, '*'.repeat(20));
});

test('maskPasswords tolerates null values and numeric keys without skipping secrets', () => {
  // Integer-like keys order first; the recursion must not clobber its own key list, and
  // typeof null === 'object' must not send it into Object.keys(null).
  const config = { '1': { nested: 'value' }, lnApiPassword: 'eclair-pass', nothing: null };
  const masked = Common.maskPasswords(config);
  assert.equal(masked.lnApiPassword, '*'.repeat(20));
  assert.equal(masked.nothing, null);
  assert.deepEqual(masked['1'], { nested: 'value' });
});

test('handleError does not echo the absolute file path to the caller', () => {
  // The path belongs in the server log, not in the API response.
  const err = Common.handleError({ code: 'ENOENT', path: '/secret/dir/RTL-Config.json' }, 'Test', 'Reading Config Error', { lnImplementation: 'LND', settings: {} });
  assert.equal(err.error.includes('/secret/dir'), false);
  assert.equal(err.message.includes('/secret/dir'), false);
});

test('handleError keeps the absolute path out of controller-wrapped errors too', () => {
  // RTLConf handlers pass { statusCode, message, error: errRes } wrappers; the response
  // must resolve to the caller's generic message, never the wrapped fs error's path.
  const err = Common.handleError(
    { statusCode: 500, message: 'Reading File Error', error: { code: 'ENOENT', path: '/secret/dir/x.bak' } },
    'Test', 'Reading File Error', { lnImplementation: 'LND', settings: {} }
  );
  assert.equal(err.error.includes('/secret/dir'), false);
  assert.equal(err.message.includes('/secret/dir'), false);
});

test('maskPasswords masks every value under a headers key', () => {
  // Header values are always credential carriers here (macaroon, rune, basic auth), and
  // key-substring matching cannot catch them without also hiding *Path fields.
  const config = {
    authentication: {
      macaroonPath: '/visible/path',
      options: { headers: { 'Grpc-Metadata-macaroon': 'deadbeef', rune: 'cln-rune', authorization: 'Basic xyz' } }
    }
  };
  const masked = Common.maskPasswords(config);
  assert.equal(masked.authentication.options.headers['Grpc-Metadata-macaroon'], '*'.repeat(20));
  assert.equal(masked.authentication.options.headers.rune, '*'.repeat(20));
  assert.equal(masked.authentication.options.headers.authorization, '*'.repeat(20));
  assert.equal(masked.authentication.macaroonPath, '/visible/path');
});

const seedAppConfig = () => {
  Common.appConfig = {
    defaultNodeIndex: 0,
    selectedNodeIndex: 0,
    rtlConfFilePath: '/conf',
    dbDirectoryPath: '/db',
    rtlPass: 'server-hash',
    allowPasswordUpdate: true,
    enable2FA: true,
    secret2FA: 'server-seed',
    disableAuth: false,
    SSO: { rtlSSO: 0, rtlCookiePath: '/server-cookie', logoutRedirectLink: 'https://server-logout', cookieValue: 'server-cookie' },
    nodes: []
  };
  Common.selectedNode = null;
  Common.nodes = [];
};

test('addSecureData pins disableAuth and the SSO object to server-held values', () => {
  // The settings API must not be able to flip the authentication mode or move SSO fields;
  // client-supplied values for these are deployment-level switches, not settings.
  seedAppConfig();
  const config = Common.addSecureData({
    disableAuth: true,
    SSO: { rtlSSO: 1, rtlCookiePath: '/client-path', logoutRedirectLink: 'https://client', cookieValue: 'client-cookie' },
    secret2FA: 'client-seed',
    nodes: []
  });
  assert.equal(config.disableAuth, false);
  assert.deepEqual(config.SSO, { rtlSSO: 0, rtlCookiePath: '/server-cookie', logoutRedirectLink: 'https://server-logout', cookieValue: 'server-cookie' });
  // An explicit non-empty seed is the settings UI's enable flow and is honored.
  assert.equal(config.secret2FA, 'client-seed');
  assert.equal(config.enable2FA, true);
});

test('addSecureData restores an omitted TOTP seed and derives enable2FA from the seed', () => {
  seedAppConfig();
  const config = Common.addSecureData({ nodes: [] });
  assert.equal(config.secret2FA, 'server-seed');
  assert.equal(config.enable2FA, true);
});

test('addSecureData treats an empty seed with 2FA claimed on as an omission', () => {
  // The pre-login config response shape carries secret2FA: ''; echoing it must not wipe
  // the seed while enable2FA stays on.
  seedAppConfig();
  const config = Common.addSecureData({ secret2FA: '', enable2FA: true, nodes: [] });
  assert.equal(config.secret2FA, 'server-seed');
  assert.equal(config.enable2FA, true);
});

test('addSecureData honors an explicit seed wipe only when 2FA is disabled', () => {
  // The settings UI's disable flow sends secret2FA: '' together with enable2FA: false.
  seedAppConfig();
  const config = Common.addSecureData({ secret2FA: '', enable2FA: false, nodes: [] });
  assert.equal(config.secret2FA, '');
  assert.equal(config.enable2FA, false);
});

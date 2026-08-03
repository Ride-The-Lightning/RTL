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

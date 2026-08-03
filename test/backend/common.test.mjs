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

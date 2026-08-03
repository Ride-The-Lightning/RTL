import assert from 'node:assert/strict';
import test from 'node:test';

import * as otplib from 'otplib';
import { authenticateUser } from '../../backend/controllers/shared/authenticate.js';
import { Common } from '../../backend/utils/common.js';

const { authenticator } = otplib;

const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const PASSWORD_HASH = 'hashed-password';

const setupAppConfig = (secret2FA) => {
  Common.appConfig = {
    defaultNodeIndex: 0,
    selectedNodeIndex: 0,
    rtlConfFilePath: '',
    dbDirectoryPath: '',
    rtlPass: PASSWORD_HASH,
    allowPasswordUpdate: true,
    enable2FA: !!secret2FA,
    secret2FA: secret2FA,
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' },
    nodes: []
  };
  Common.selectedNode = null;
  Common.nodes = [];
};

// Distinct IPs per call: failedLoginAttempts is module-level state in authenticate.js,
// keyed by request IP, so unique values keep the tests isolated from each other.
let ipCounter = 0;
const mockRequest = (twoFAToken) => {
  ipCounter = ipCounter + 1;
  return {
    body: { authenticateWith: 'PASSWORD', authenticationValue: PASSWORD_HASH, twoFAToken: twoFAToken },
    session: {},
    headers: { 'x-forwarded-for': '10.0.0.' + ipCounter },
    connection: {},
    socket: {}
  };
};

const mockResponse = () => {
  const res = { statusCode: null, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return { json: (body) => { res.body = body; } };
  };
  return res;
};

test('rejects login without a 2FA token when 2FA is enabled', () => {
  setupAppConfig(TOTP_SECRET);
  for (const missingToken of [undefined, '']) {
    const res = mockResponse();
    authenticateUser(mockRequest(missingToken), res, null);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.error, /2FA/);
  }
});

test('rejects login with an invalid 2FA token when 2FA is enabled', () => {
  setupAppConfig(TOTP_SECRET);
  const res = mockResponse();
  authenticateUser(mockRequest('000000'), res, null);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /2FA/);
});

test('accepts login with a valid 2FA token when 2FA is enabled', () => {
  setupAppConfig(TOTP_SECRET);
  const res = mockResponse();
  authenticateUser(mockRequest(authenticator.generate(TOTP_SECRET)), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

test('accepts password-only login when 2FA is not configured', () => {
  setupAppConfig('');
  const res = mockResponse();
  authenticateUser(mockRequest(undefined), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

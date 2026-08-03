import assert from 'node:assert/strict';
import test from 'node:test';

import jwt from 'jsonwebtoken';
import * as otplib from 'otplib';
import { authenticateUser } from '../../backend/controllers/shared/authenticate.js';
import { Common } from '../../backend/utils/common.js';

const { authenticator } = otplib;

const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const PASSWORD_HASH = 'hashed-password';

const setupAppConfig = (enable2FA, secret2FA) => {
  Common.appConfig = {
    defaultNodeIndex: 0,
    selectedNodeIndex: 0,
    rtlConfFilePath: '',
    dbDirectoryPath: '',
    rtlPass: PASSWORD_HASH,
    allowPasswordUpdate: true,
    enable2FA: enable2FA,
    secret2FA: secret2FA,
    SSO: { rtlSSO: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' },
    nodes: []
  };
  Common.selectedNode = null;
  Common.nodes = [];
};

// failedLoginAttempts is module-level state in authenticate.js, keyed by the request IP
// from common.getRequestIP, which prefers x-forwarded-for (server/utils/common.ts).
// Unique IPs give each call a fresh counter; tests exercising the counter itself pass an
// explicit ip to share one key across calls.
let ipCounter = 0;
const nextIP = () => '10.0.0.' + (ipCounter = ipCounter + 1);
const mockRequest = ({ twoFAToken, ip, authToken, password } = {}) => {
  const headers = { 'x-forwarded-for': ip || nextIP() };
  if (authToken) { headers.authorization = 'Bearer ' + authToken; }
  return {
    body: { authenticateWith: 'PASSWORD', authenticationValue: password || PASSWORD_HASH, twoFAToken: twoFAToken },
    session: {},
    headers: headers,
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

const mockSessionToken = () => jwt.sign({ user: 'NODE_USER' }, Common.secret_key);

test('rejects login without a 2FA token when 2FA is enabled', () => {
  setupAppConfig(true, TOTP_SECRET);
  for (const missingToken of [undefined, '']) {
    const res = mockResponse();
    authenticateUser(mockRequest({ twoFAToken: missingToken }), res, null);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.error, /2FA/);
  }
});

test('rejects login with an invalid 2FA token when 2FA is enabled', () => {
  setupAppConfig(true, TOTP_SECRET);
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: '000000' }), res, null);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /2FA/);
});

test('rejects a non-string 2FA token when 2FA is enabled', () => {
  setupAppConfig(true, TOTP_SECRET);
  // A JSON body can carry an array/object/number. otplib 12.0.1 coerces and rejects these
  // (digit regex, then strict === against the string token), but the typeof guard keeps the
  // rejection explicit and independent of otplib internals.
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: ['1', '2', '3', '4', '5', '6'] }), res, null);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /2FA/);
});

test('accepts login with a valid 2FA token when 2FA is enabled', () => {
  setupAppConfig(true, TOTP_SECRET);
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: authenticator.generate(TOTP_SECRET) }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

test('accepts password-only re-authorization from an authenticated session when 2FA is enabled', () => {
  // In-app re-authorization (e.g. the password prompt before on-chain sends) carries the
  // session JWT via the auth interceptor; that session was itself minted after 2FA.
  setupAppConfig(true, TOTP_SECRET);
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: undefined, authToken: mockSessionToken() }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

test('rejects a wrong password even with an authenticated session when 2FA is enabled', () => {
  setupAppConfig(true, TOTP_SECRET);
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: undefined, authToken: mockSessionToken(), password: 'wrong-hash' }), res, null);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /Invalid Password/);
});

test('locks out after five failed 2FA attempts, even for a then-valid token', () => {
  setupAppConfig(true, TOTP_SECRET);
  const ip = nextIP(); // one shared counter key for every attempt in this test
  for (let i = 0; i < 4; i++) {
    const res = mockResponse();
    authenticateUser(mockRequest({ twoFAToken: '000000', ip: ip }), res, null);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.error, /2FA/);
  }
  const fifth = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: '000000', ip: ip }), fifth, null);
  assert.equal(fifth.statusCode, 401);
  assert.match(fifth.body.error, /locked/);
  const sixth = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: authenticator.generate(TOTP_SECRET), ip: ip }), sixth, null);
  assert.equal(sixth.statusCode, 401);
  assert.match(sixth.body.error, /locked/);
});

test('accepts password-only login when 2FA is not configured', () => {
  setupAppConfig(false, '');
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: undefined }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

test('accepts a stale token in the request when 2FA is not configured', () => {
  // Pins an intentional behavior change: previously a non-empty twoFAToken with no
  // configured secret was rejected (verifyToken short-circuits on the empty secret);
  // with no 2FA configured the token is now ignored entirely.
  setupAppConfig(false, '');
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: '123456' }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

test('does not require a token when 2FA is disabled but a stale secret remains', () => {
  // The login UI prompts only when enable2FA is set, so enforcing a token on a stale
  // secret would lock the operator out of a UI that never asks for one.
  setupAppConfig(false, TOTP_SECRET);
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: undefined }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

test('does not enforce a token when 2FA is enabled without a secret', () => {
  // Divergence is only reachable via a crafted settings update; a token could never
  // verify against an empty secret, so enforcing would lock everyone out.
  setupAppConfig(true, '');
  const res = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: undefined }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
});

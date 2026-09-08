import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after } from 'node:test';

import jwt from 'jsonwebtoken';
import * as otplib from 'otplib';
import { authenticateUser, getFailedInfo, recordFailedAttempt, sweepExpiredAttempts, clearFailedAttempts, trackedAddresses, resetForwardedHeaderWarning, ALLOWED_LOGIN_ATTEMPTS, LOCKING_PERIOD, MAX_TRACKED_ADDRESSES } from '../../backend/controllers/shared/authenticate.js';
import { Common } from '../../backend/utils/common.js';
import { Logger } from '../../backend/utils/logger.js';

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
  Common.trustedProxies = '';
};

// Captures what the controller logs while fn runs; the controller reads Logger.log at call
// time, so swapping the method is enough.
const captureLog = (fn) => {
  const lines = [];
  const original = Logger.log;
  Logger.log = (entry) => lines.push(entry);
  try { fn(); } finally { Logger.log = original; }
  return lines;
};

// failedLoginAttempts is module-level state in authenticate.js, keyed by the request IP
// from common.getRequestIP, which reads req.ip -- what express derives from the socket peer
// and, only through configured trusted proxies, X-Forwarded-For (see common.test.mjs for
// that derivation). Unique IPs give each call a fresh counter; tests exercising the counter
// itself pass an explicit ip to share one key across calls.
let ipCounter = 0;
const nextIP = () => {
  ipCounter = ipCounter + 1;
  return '10.' + ((ipCounter >> 16) & 255) + '.' + ((ipCounter >> 8) & 255) + '.' + (ipCounter & 255);
};
const mockRequest = (opts = {}) => {
  const { twoFAToken, ip, authToken, password, forwardedFor, authenticateWith, noAddress } = opts;
  const headers = {};
  if (authToken) { headers.authorization = 'Bearer ' + authToken; }
  if (forwardedFor) { headers['x-forwarded-for'] = forwardedFor; }
  return {
    body: {
      authenticateWith: authenticateWith || 'PASSWORD',
      // authenticationValue is taken verbatim when given, so a test can send a non-string.
      authenticationValue: ('authenticationValue' in opts) ? opts.authenticationValue : (password || PASSWORD_HASH),
      twoFAToken: twoFAToken
    },
    session: {},
    headers: headers,
    // noAddress models a request whose socket is already gone: no req.ip, no peer address.
    ip: noAddress ? undefined : (ip || nextIP()),
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

// Lockout bookkeeping (issue #1656). getFailedInfo / recordFailedAttempt are the units that
// decide whether a stored counter is live, so they are exercised directly with an explicit
// clock. Tests that fill the table call clearFailedAttempts first so ordering between
// tests carries no hidden state.
const failTimes = (ip, times, at) => {
  for (let i = 0; i < times; i++) { recordFailedAttempt(ip, at); }
};

test('a failed-attempt counter expires after the locking period', () => {
  const ip = nextIP();
  const start = Date.now();
  failTimes(ip, ALLOWED_LOGIN_ATTEMPTS, start);
  assert.equal(getFailedInfo(ip, start + LOCKING_PERIOD).count, ALLOWED_LOGIN_ATTEMPTS, 'still locked inside the period');
  assert.equal(getFailedInfo(ip, start + LOCKING_PERIOD + 1).count, 0, 'unlocked once the period has elapsed');
});

test('a locked-out address can log in again once the locking period has elapsed', () => {
  setupAppConfig(false, '');
  const ip = nextIP();
  for (let i = 0; i < ALLOWED_LOGIN_ATTEMPTS; i++) {
    authenticateUser(mockRequest({ ip: ip, password: 'wrong' }), mockResponse(), null);
  }
  const locked = mockResponse();
  authenticateUser(mockRequest({ ip: ip }), locked, null);
  assert.equal(locked.statusCode, 401);
  assert.match(locked.body.error, /locked/);
  // Age the stored entry past the locking period instead of waiting for it.
  getFailedInfo(ip, Date.now()).lastTried = Date.now() - LOCKING_PERIOD - 1;
  const res = mockResponse();
  authenticateUser(mockRequest({ ip: ip }), res, null);
  assert.equal(res.statusCode, 200);
});

test('a locked address ignores further failures, so the window cannot be extended', () => {
  const ip = nextIP();
  const start = Date.now();
  failTimes(ip, ALLOWED_LOGIN_ATTEMPTS, start);
  const late = start + LOCKING_PERIOD - 1;
  recordFailedAttempt(ip, late);
  assert.equal(getFailedInfo(ip, late).lastTried, start, 'the deadline did not move');
  assert.equal(getFailedInfo(ip, late).count, ALLOWED_LOGIN_ATTEMPTS, 'the count did not grow');
  assert.equal(getFailedInfo(ip, start + LOCKING_PERIOD + 1).count, 0, 'the original deadline still lifts the lock');
});

test('while locked, the response does not depend on whether the password was correct', () => {
  setupAppConfig(false, '');
  const ip = nextIP();
  for (let i = 0; i < ALLOWED_LOGIN_ATTEMPTS; i++) {
    authenticateUser(mockRequest({ ip: ip, password: 'wrong' }), mockResponse(), null);
  }
  const deadline = getFailedInfo(ip, Date.now()).lastTried;
  // Make the clock visibly move between the two probes; a leaked lastTried would differ by this.
  getFailedInfo(ip, Date.now()).lastTried = deadline - 10 * 60 * 1000;
  const shifted = getFailedInfo(ip, Date.now()).lastTried;
  const right = mockResponse();
  authenticateUser(mockRequest({ ip: ip }), right, null);
  const wrong = mockResponse();
  authenticateUser(mockRequest({ ip: ip, password: 'wrong' }), wrong, null);
  assert.equal(right.statusCode, 401);
  assert.equal(wrong.statusCode, 401);
  assert.deepEqual(wrong.body, right.body, 'identical body for a right and a wrong guess');
  assert.equal(getFailedInfo(ip, Date.now()).lastTried, shifted, 'neither probe moved the deadline');
});

test('a successful login clears a partial streak of failures', () => {
  clearFailedAttempts();
  setupAppConfig(false, '');
  const ip = nextIP();
  for (let i = 0; i < ALLOWED_LOGIN_ATTEMPTS - 1; i++) {
    authenticateUser(mockRequest({ ip: ip, password: 'wrong' }), mockResponse(), null);
  }
  assert.equal(getFailedInfo(ip, Date.now()).count, ALLOWED_LOGIN_ATTEMPTS - 1);
  const res = mockResponse();
  authenticateUser(mockRequest({ ip: ip }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(trackedAddresses(), 0, 'the entry is gone, not merely zeroed');
  assert.equal(getFailedInfo(ip, Date.now()).count, 0);
});

test('recordFailedAttempt derives the entry from the table and returns what it stored', () => {
  const ip = nextIP();
  const start = Date.now();
  failTimes(ip, ALLOWED_LOGIN_ATTEMPTS, start);
  const locked = recordFailedAttempt(ip, start + 1);
  assert.equal(locked, getFailedInfo(ip, start + 1), 'a locked address returns its live, unchanged entry');
  assert.equal(locked.count, ALLOWED_LOGIN_ATTEMPTS);
  assert.equal(locked.lastTried, start);
  const revived = recordFailedAttempt(ip, start + LOCKING_PERIOD + 1);
  assert.equal(revived.count, 1, 'an expired entry is dropped, not revived');
  assert.equal(revived, getFailedInfo(ip, start + LOCKING_PERIOD + 1), 'the returned entry is the stored one');
});

test('with 2FA enabled, the 401 does not reveal whether the password was correct', () => {
  setupAppConfig(true, TOTP_SECRET);
  const wrongPassword = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: '000000', password: 'wrong' }), wrongPassword, null);
  const wrongToken = mockResponse();
  authenticateUser(mockRequest({ twoFAToken: '000000' }), wrongToken, null);
  const noToken = mockResponse();
  authenticateUser(mockRequest({}), noToken, null);
  assert.equal(wrongPassword.statusCode, 401);
  assert.deepEqual(wrongToken.body, wrongPassword.body, 'a right password with a wrong token reads like a wrong password');
  assert.deepEqual(noToken.body, wrongPassword.body, 'a right password with no token reads like a wrong password');
});

test('a single sweep removes every expired counter', () => {
  clearFailedAttempts();
  const start = Date.now();
  const expired = [nextIP(), nextIP()];
  const live = nextIP();
  expired.forEach((ip) => failTimes(ip, 1, start));
  failTimes(live, 1, start + LOCKING_PERIOD);
  assert.equal(trackedAddresses(), 3);
  sweepExpiredAttempts(start + LOCKING_PERIOD + 1);
  // Both expired entries go in one pass. The actual regression -- clearInterval inside the
  // callback cancelling every later pass -- is in the 30-minute unref'd timer and is not driven here.
  assert.equal(trackedAddresses(), 1);
  assert.equal(getFailedInfo(live, start + LOCKING_PERIOD + 1).count, 1, 'a live entry survives the sweep');
});

test('a lookup or a successful login does not consume a slot in the table', () => {
  clearFailedAttempts();
  setupAppConfig(false, '');
  const now = Date.now();
  const tracked = nextIP();
  failTimes(tracked, 1, now);
  for (let i = 0; i < MAX_TRACKED_ADDRESSES + 5; i++) {
    getFailedInfo('lookup-' + i, now);
    authenticateUser(mockRequest(), mockResponse(), null);
  }
  assert.equal(trackedAddresses(), 1, 'lookups and successful logins stored nothing');
  assert.equal(getFailedInfo(tracked, now).count, 1, 'nothing above evicted the tracked entry');
});

test('the number of tracked addresses is bounded, evicting the least recently failed first', () => {
  clearFailedAttempts();
  const now = Date.now();
  const first = 'bound-first';
  failTimes(first, 1, now);
  for (let i = 0; i < MAX_TRACKED_ADDRESSES; i++) {
    failTimes('bound-' + i, 1, now + 1 + i);
  }
  assert.equal(trackedAddresses(), MAX_TRACKED_ADDRESSES);
  assert.equal(getFailedInfo(first, now + 1).count, 0, 'the oldest unlocked entry was evicted to make room');
  assert.equal(getFailedInfo('bound-0', now + 1).count, 1, 'the next one is still tracked');
});

test('table pressure evicts unlocked entries before a live lockout', () => {
  clearFailedAttempts();
  const now = Date.now();
  const locked = 'pressure-locked';
  failTimes(locked, ALLOWED_LOGIN_ATTEMPTS, now); // oldest entry in the table
  for (let i = 0; i < MAX_TRACKED_ADDRESSES + 10; i++) {
    failTimes('pressure-' + i, 1, now + 1 + i);
  }
  assert.equal(getFailedInfo(locked, now + 1).count, ALLOWED_LOGIN_ATTEMPTS, 'the lockout survived the churn');
});

test('when every tracked address is locked, the oldest lockout is the one evicted', () => {
  clearFailedAttempts();
  const now = Date.now();
  for (let i = 0; i < MAX_TRACKED_ADDRESSES; i++) {
    failTimes('all-locked-' + i, ALLOWED_LOGIN_ATTEMPTS, now + i);
  }
  failTimes('all-locked-new', 1, now + MAX_TRACKED_ADDRESSES);
  assert.equal(getFailedInfo('all-locked-0', now + 1).count, 0, 'the oldest lockout went');
  assert.equal(getFailedInfo('all-locked-1', now + 1).count, ALLOWED_LOGIN_ATTEMPTS, 'the next oldest stayed');
  assert.equal(getFailedInfo('all-locked-new', now + 1).count, 1, 'the newcomer is tracked');
  clearFailedAttempts();
});

test('failed-attempt counters are keyed safely against prototype names', () => {
  const now = Date.now();
  assert.equal(getFailedInfo('__proto__', now).count, 0);
  assert.equal(getFailedInfo('constructor', now).count, 0);
  failTimes('__proto__', 2, now);
  assert.equal(getFailedInfo('__proto__', now).count, 2);
  assert.equal(getFailedInfo('toString', now).count, 0);
});

test('the lockout counter keys on req.ip and ignores X-Forwarded-For', () => {
  setupAppConfig(false, '');
  const ip = nextIP();
  for (let i = 0; i < ALLOWED_LOGIN_ATTEMPTS; i++) {
    // Rotating the header used to hand the client a fresh counter per request (issue #1656).
    authenticateUser(mockRequest({ ip: ip, password: 'wrong', forwardedFor: '203.0.113.' + i }), mockResponse(), null);
  }
  const locked = mockResponse();
  authenticateUser(mockRequest({ ip: ip, forwardedFor: '203.0.113.99' }), locked, null);
  assert.equal(locked.statusCode, 401);
  assert.match(locked.body.error, /locked/);
  // Nor can the header aim a request at another address's counter.
  const other = mockResponse();
  authenticateUser(mockRequest({ forwardedFor: ip }), other, null);
  assert.equal(other.statusCode, 200);
});

// SSO mode (issue #1656, finding 4). The access key a caller presents is the hex SHA-256 of
// the cookie file; the tests below drive the same branch verify-sso.sh exercises against
// the BTCPay harness, with a temporary cookie file so a successful login can rotate it.
const SSO_COOKIE = 'a'.repeat(64);
const ssoAccessKey = () => createHash('sha256').update(SSO_COOKIE).digest('hex');
const ssoTempDirs = [];
after(() => ssoTempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
const setupSSOConfig = () => {
  setupAppConfig(false, '');
  const dir = mkdtempSync(join(tmpdir(), 'rtl-sso-'));
  ssoTempDirs.push(dir);
  const cookiePath = join(dir, '.cookie');
  writeFileSync(cookiePath, SSO_COOKIE);
  Common.appConfig.SSO = { rtlSSO: 1, rtlCookiePath: cookiePath, logoutRedirectLink: '', cookieValue: SSO_COOKIE };
  // The refusal path logs through handleError against the selected node; before login the
  // session has none and it falls back to the process-wide one, which app startup sets.
  Common.selectedNode = { index: 1, lnNode: 'node', lnImplementation: 'LND', settings: { logLevel: 'ERROR' } };
  return cookiePath;
};

test('SSO: the access key derived from the cookie is accepted and the cookie rotates', () => {
  const cookiePath = setupSSOConfig();
  const res = mockResponse();
  authenticateUser(mockRequest({ authenticationValue: ssoAccessKey() }), res, null);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.token, 'string');
  const rotated = readFileSync(cookiePath, 'utf-8');
  assert.notEqual(rotated, SSO_COOKIE, 'a used cookie is replaced');
  assert.equal(Common.appConfig.SSO.cookieValue, rotated, 'and the replacement is what the next login must match');
});

test('SSO: an access key that is not a 64-byte string is refused with 406, not thrown', () => {
  setupSSOConfig();
  // crypto.timingSafeEqual throws RangeError on a length mismatch and Buffer.from throws
  // TypeError on a non-string; either used to surface as a 400 from the catch-all handler.
  const key = ssoAccessKey();
  for (const bad of [undefined, null, 123, ['a'], { key }, '', 'short', key + '0', key.slice(0, 63) + '\u00e9']) {
    const res = mockResponse();
    assert.doesNotThrow(() => authenticateUser(mockRequest({ authenticationValue: bad }), res, null));
    assert.equal(res.statusCode, 406, 'refused: ' + JSON.stringify(bad));
    assert.match(res.body.error, /SSO Authentication Failed/);
  }
});

test('SSO: a well-formed but wrong access key is refused with 406', () => {
  setupSSOConfig();
  const res = mockResponse();
  authenticateUser(mockRequest({ authenticationValue: 'f'.repeat(64) }), res, null);
  assert.equal(res.statusCode, 406);
  assert.match(res.body.error, /SSO Authentication Failed/);
});

test('SSO: a JWT that does not verify is refused with 406, not thrown', () => {
  setupSSOConfig();
  // jwt.verify throws on a missing, malformed or foreign token; that too was a 400.
  for (const bad of [undefined, '', 'not-a-jwt', jwt.sign({ user: 'NODE_USER' }, 'some-other-secret')]) {
    const res = mockResponse();
    assert.doesNotThrow(() => authenticateUser(mockRequest({ authenticateWith: 'JWT', authenticationValue: bad }), res, null));
    assert.equal(res.statusCode, 406, 'refused: ' + JSON.stringify(bad));
  }
  // A token this process minted is recognised, and still told SSO takes no password login.
  const res = mockResponse();
  authenticateUser(mockRequest({ authenticateWith: 'JWT', authenticationValue: mockSessionToken() }), res, null);
  assert.equal(res.statusCode, 406);
  assert.match(res.body.error, /not allowed with SSO/);
});

test('SSO: an unrecognised authenticateWith gets a 406 rather than no reply at all', () => {
  setupSSOConfig();
  const res = mockResponse();
  authenticateUser(mockRequest({ authenticateWith: 'NOAUTH', authenticationValue: ssoAccessKey() }), res, null);
  assert.equal(res.statusCode, 406);
});

test('the first login carrying X-Forwarded-For while no proxy is trusted logs a configuration warning, once', () => {
  setupAppConfig(false, '');
  resetForwardedHeaderWarning();
  const isWarning = (entry) => /trustedProxies/.test(entry.msg);
  const plain = captureLog(() => authenticateUser(mockRequest(), mockResponse(), null));
  assert.equal(plain.filter(isWarning).length, 0, 'a request without the header says nothing');
  const first = captureLog(() => authenticateUser(mockRequest({ ip: '10.9.9.1', forwardedFor: '203.0.113.7' }), mockResponse(), null));
  assert.equal(first.filter(isWarning).length, 1);
  assert.match(first.find(isWarning).msg, /10\.9\.9\.1/, 'names the address the lockout is keyed on');
  const second = captureLog(() => authenticateUser(mockRequest({ forwardedFor: '203.0.113.8' }), mockResponse(), null));
  assert.equal(second.filter(isWarning).length, 0, 'one-shot');
  // With a proxy trusted, the header is honoured and there is nothing to warn about.
  resetForwardedHeaderWarning();
  Common.trustedProxies = '127.0.0.1';
  const trusted = captureLog(() => authenticateUser(mockRequest({ forwardedFor: '203.0.113.9' }), mockResponse(), null));
  assert.equal(trusted.filter(isWarning).length, 0);
  Common.trustedProxies = '';
});

test('a login with no determinable client address is refused, not counted under a shared key', () => {
  clearFailedAttempts();
  setupAppConfig(false, '');
  const res = mockResponse();
  authenticateUser(mockRequest({ noAddress: true, password: 'wrong' }), res, null);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /address could not be determined/);
  assert.equal(trackedAddresses(), 0, 'nothing was recorded');
  const right = mockResponse();
  authenticateUser(mockRequest({ noAddress: true }), right, null);
  assert.equal(right.statusCode, 401, 'the right password is refused too: the lockout cannot be applied');
});

test('on a unix-socket listener every client shares one fixed key instead of being refused', () => {
  // A path-based listener (non-numeric port) has no peer address on any connection; the
  // lockout still has to work there, so the key is a constant rather than a refusal.
  clearFailedAttempts();
  setupAppConfig(false, '');
  const savedPort = Common.port;
  Common.port = '/tmp/rtl.sock';
  try {
    const res = mockResponse();
    authenticateUser(mockRequest({ noAddress: true }), res, null);
    assert.equal(res.statusCode, 200);
    for (let i = 0; i < ALLOWED_LOGIN_ATTEMPTS; i++) {
      authenticateUser(mockRequest({ noAddress: true, password: 'wrong' }), mockResponse(), null);
    }
    assert.equal(trackedAddresses(), 1, 'one shared counter');
    const locked = mockResponse();
    authenticateUser(mockRequest({ noAddress: true }), locked, null);
    assert.equal(locked.statusCode, 401);
    assert.match(locked.body.error, /locked/);
  } finally {
    Common.port = savedPort;
    clearFailedAttempts();
  }
});

test('SSO: the server log names which of the three refusal causes applied', () => {
  setupSSOConfig();
  // Every field of every log entry, so a mode value smuggled into the error payload shows too.
  const logged = (opts) => captureLog(() => authenticateUser(mockRequest(opts), mockResponse(), null)).map((e) => JSON.stringify(e)).join('\n');
  assert.match(logged({ authenticationValue: 'short' }), /access key too short or does not match/);
  assert.match(logged({ authenticateWith: 'JWT', authenticationValue: 'not-a-jwt' }), /session token did not verify/);
  const unknown = logged({ authenticateWith: '<script>', authenticationValue: 'x' });
  assert.match(unknown, /neither PASSWORD nor JWT/);
  assert.doesNotMatch(unknown, /<script>/, 'the client-supplied mode value is not echoed into the log');
});

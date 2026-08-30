import jwt from 'jsonwebtoken';
import * as otplib from 'otplib';
import * as crypto from 'crypto';
import { Database } from '../../utils/database.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
const logger = Logger;
const common = Common;
const ONE_MINUTE = 60000;
export const LOCKING_PERIOD = 30 * ONE_MINUTE; // HALF AN HOUR
export const ALLOWED_LOGIN_ATTEMPTS = 5;
export const MAX_TRACKED_ADDRESSES = 1000;
// Keyed by request IP. A Map (not a plain object) so client-supplied keys such as
// "__proto__" cannot collide with Object.prototype, and bounded so an attacker
// rotating addresses cannot grow it without limit (issue #1656).
const failedLoginAttempts = new Map();
const databaseService = Database;
const hasExpired = (failed, currentTime) => currentTime > (failed.lastTried + LOCKING_PERIOD);
const isLocked = (failed, currentTime) => failed.count >= ALLOWED_LOGIN_ATTEMPTS && !hasExpired(failed, currentTime);
export const sweepExpiredAttempts = (currentTime) => {
    for (const [ip, failed] of failedLoginAttempts) {
        if (hasExpired(failed, currentTime)) {
            failedLoginAttempts.delete(ip);
        }
    }
};
export const clearFailedAttempts = () => failedLoginAttempts.clear();
export const trackedAddresses = () => failedLoginAttempts.size;
const loginInterval = setInterval(() => sweepExpiredAttempts(new Date().getTime()), LOCKING_PERIOD);
// The sweeper must not hold the event loop open on its own (it would keep
// `node --test` or a CLI invocation alive for the full 30-minute period).
loginInterval.unref();
// A lookup never stores anything, so first-contact visitors and successful logins do not
// consume a slot in the bounded table; only recordFailedAttempt inserts. The return value is
// the live table entry when one exists (mutating it mutates the table) and a detached
// object otherwise, which only becomes tracked once handed to recordFailedAttempt.
export const getFailedInfo = (reqIP, currentTime) => {
    const existing = failedLoginAttempts.get(reqIP);
    return (existing && !hasExpired(existing, currentTime)) ? existing : { count: 0, lastTried: currentTime };
};
// Records one failure for reqIP and returns the entry now stored for it. Derives the
// entry itself rather than trusting a caller-held object, so a live lockout is immutable
// and an expired one is dropped whatever the caller holds.
export const recordFailedAttempt = (reqIP, currentTime) => {
    const failed = getFailedInfo(reqIP, currentTime);
    // A locked address records nothing more: the 401 it gets must depend on the lockout
    // alone, never on the credential offered (a moving deadline would tell a wrong guess
    // from a right one), and the window is fixed rather than extendable by more failures.
    if (isLocked(failed, currentTime)) {
        return failed;
    }
    failed.count = failed.count + 1;
    failed.lastTried = currentTime;
    // Delete before set so the entry moves to the back: Map iterates in insertion order,
    // so the head is the least recently failed address.
    failedLoginAttempts.delete(reqIP);
    if (failedLoginAttempts.size >= MAX_TRACKED_ADDRESSES) {
        // Evict the least recently failed address that is not currently locked out, so
        // table pressure cannot flush a live lockout; only when every tracked address is
        // locked does the oldest lockout go.
        let evict = failedLoginAttempts.keys().next().value;
        for (const [ip, entry] of failedLoginAttempts) {
            if (!isLocked(entry, currentTime)) {
                evict = ip;
                break;
            }
        }
        failedLoginAttempts.delete(evict);
    }
    failedLoginAttempts.set(reqIP, failed);
    return failed;
};
const handleMultipleFailedAttemptsError = (failed, currentTime, errMsg) => {
    if (isLocked(failed, currentTime)) {
        return {
            message: 'Multiple Failed Login Attempts!',
            error: 'Application locked for ' + (LOCKING_PERIOD / ONE_MINUTE) + ' minutes due to multiple failed attempts!\nTry again after ' + common.convertTimestampToTime((failed.lastTried + LOCKING_PERIOD) / 1000) + '!'
        };
    }
    else {
        return {
            message: 'Authentication Failed!',
            error: errMsg + '\nApplication will be locked after ' + (ALLOWED_LOGIN_ATTEMPTS - failed.count) + ' more unsuccessful attempts!'
        };
    }
};
export const verifyToken = (twoFAToken) => !!(common.appConfig.secret2FA && common.appConfig.secret2FA !== '' && otplib.authenticator.check(twoFAToken, common.appConfig.secret2FA));
// Mirrors isAuthenticated: a request carrying a valid session JWT has already
// completed 2FA at login, since tokens are only minted after verification when
// 2FA is enabled. Used to exempt in-app re-authorization (e.g. the password
// prompt before on-chain sends) from the TOTP requirement without opening a
// password-only path.
const hasValidAuthToken = (req) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token, common.secret_key);
        return true;
    }
    catch (error) {
        return false;
    }
};
export const authenticateUser = (req, res, next) => {
    const { authenticateWith, authenticationValue, twoFAToken } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Authenticating User..' });
    if (!!common.appConfig.disableAuth) {
        if (!req.session.selectedNode) {
            req.session.selectedNode = common.selectedNode;
        }
        const token = jwt.sign({ user: 'AUTH_DISABLED_USER' }, common.secret_key);
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'User Disabled Authentication' });
        res.status(200).json({ token: token });
    }
    else if (+common.appConfig.SSO.rtlSSO) {
        if (authenticateWith === 'JWT' && jwt.verify(authenticationValue, common.secret_key)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated' });
            res.status(406).json({ message: 'SSO Authentication Error', error: 'Login with Password is not allowed with SSO.' });
        }
        else if (authenticateWith === 'PASSWORD') {
            if (common.appConfig.SSO.cookieValue.trim().length >= 32 && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(common.appConfig.SSO.cookieValue).digest('hex'), 'utf-8'), Buffer.from(authenticationValue, 'utf-8'))) {
                common.refreshCookie();
                if (!req.session.selectedNode) {
                    req.session.selectedNode = common.selectedNode;
                }
                const token = jwt.sign({ user: 'SSO_USER' }, common.secret_key);
                logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated' });
                res.status(200).json({ token: token });
            }
            else {
                const errMsg = 'SSO Authentication Failed! Access key too short or does not match.';
                const err = common.handleError({ statusCode: 406, message: 'SSO Authentication Error', error: errMsg }, 'Authenticate', errMsg, req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            }
        }
    }
    else {
        const currentTime = new Date().getTime();
        const reqIP = common.getRequestIP(req);
        const failed = getFailedInfo(reqIP, currentTime);
        const password = authenticationValue;
        // When a second factor is required, neither 401 may say which credential failed:
        // the password check runs first, so a distinct "invalid token" reply would confirm a
        // correct password to a caller without the token.
        const twoFARequired = common.appConfig.enable2FA && common.appConfig.secret2FA && common.appConfig.secret2FA !== '' && !hasValidAuthToken(req);
        const errMsg = twoFARequired ? 'Invalid Password or 2FA Token!' : 'Invalid Password!';
        if (common.appConfig.rtlPass === password && !isLocked(failed, currentTime)) {
            // Gate on the server-side 2FA configuration, not on the request: when 2FA is
            // enabled a token is mandatory, so a request omitting twoFAToken is rejected
            // instead of silently skipping verification. The login UI keys its token prompt
            // on enable2FA, so both fields are consulted — a stale secret with 2FA disabled
            // must not lock the operator out of a UI that never prompts for a token.
            // Requests with a valid session token (in-app re-authorization, e.g. the
            // password prompt before on-chain sends) are exempt from the TOTP requirement.
            if (twoFARequired) {
                if (typeof twoFAToken !== 'string' || twoFAToken === '' || !verifyToken(twoFAToken)) {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Authenticate', msg: 'Invalid Token! Failed IP ' + reqIP, error: { error: 'Invalid token.' } });
                    return res.status(401).json(handleMultipleFailedAttemptsError(recordFailedAttempt(reqIP, currentTime), currentTime, errMsg));
                }
            }
            if (!req.session.selectedNode) {
                req.session.selectedNode = common.selectedNode;
            }
            failedLoginAttempts.delete(reqIP);
            const token = jwt.sign({ user: 'NODE_USER' }, common.secret_key);
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated' });
            res.status(200).json({ token: token });
        }
        else {
            // Reached for a wrong password, or for a correct one refused by a live lockout.
            const wrongPassword = common.appConfig.rtlPass !== password;
            logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Authenticate', msg: (wrongPassword ? 'Invalid Password! Failed IP ' : 'Locked Out! Failed IP ') + reqIP, error: { error: wrongPassword ? 'Invalid password.' : 'Address locked out.' } });
            const recorded = wrongPassword ? recordFailedAttempt(reqIP, currentTime) : failed;
            return res.status(401).json(handleMultipleFailedAttemptsError(recorded, currentTime, errMsg));
        }
    }
};
export const resetPassword = (req, res, next) => {
    const { currPassword, newPassword } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Resetting Password..' });
    if (+common.appConfig.SSO.rtlSSO) {
        const errMsg = 'Password cannot be reset for SSO authentication';
        const err = common.handleError({ statusCode: 401, message: 'Password Reset Error', error: errMsg }, 'Authenticate', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    else {
        if (common.appConfig.rtlPass === currPassword) {
            common.appConfig.rtlPass = common.replacePasswordWithHash(newPassword);
            const token = jwt.sign({ user: 'NODE_USER' }, common.secret_key);
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Password Reset Successful' });
            res.status(200).json({ token: token });
        }
        else {
            const errMsg = 'Incorrect Old Password';
            const err = common.handleError({ statusCode: 401, message: 'Password Reset Error', error: errMsg }, 'Authenticate', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
    }
};
export const logoutUser = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Logged out' });
    if (req.session.selectedNode && req.session.selectedNode.index) {
        databaseService.unloadDatabase(+req.session.selectedNode.index, req.session.id);
    }
    req.session.destroy((err) => {
        res.clearCookie('connect.sid');
        res.status(200).json({ loggedout: true });
    });
};

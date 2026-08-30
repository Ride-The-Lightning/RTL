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
const loginInterval = setInterval(() => {
    const now = new Date().getTime();
    for (const [ip, failed] of failedLoginAttempts) {
        if (hasExpired(failed, now)) {
            failedLoginAttempts.delete(ip);
        }
    }
}, LOCKING_PERIOD);
// The sweeper must not hold the event loop open on its own (it would keep
// `node --test` or a CLI invocation alive for the full 30-minute period).
loginInterval.unref();
export const getFailedInfo = (reqIP, currentTime) => {
    const existing = failedLoginAttempts.get(reqIP);
    if (existing && !hasExpired(existing, currentTime)) {
        return existing;
    }
    const failed = { count: 0, lastTried: currentTime };
    if (!existing && failedLoginAttempts.size >= MAX_TRACKED_ADDRESSES) {
        // Map iterates in insertion order, so the first key is the oldest entry.
        failedLoginAttempts.delete(failedLoginAttempts.keys().next().value);
    }
    failedLoginAttempts.set(reqIP, failed);
    return failed;
};
const handleMultipleFailedAttemptsError = (failed, currentTime, errMsg) => {
    if (failed.count >= ALLOWED_LOGIN_ATTEMPTS && (currentTime <= (failed.lastTried + LOCKING_PERIOD))) {
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
        if (common.appConfig.rtlPass === password && failed.count < ALLOWED_LOGIN_ATTEMPTS) {
            // Gate on the server-side 2FA configuration, not on the request: when 2FA is
            // enabled a token is mandatory, so a request omitting twoFAToken is rejected
            // instead of silently skipping verification. The login UI keys its token prompt
            // on enable2FA, so both fields are consulted — a stale secret with 2FA disabled
            // must not lock the operator out of a UI that never prompts for a token.
            // Requests with a valid session token (in-app re-authorization, e.g. the
            // password prompt before on-chain sends) are exempt from the TOTP requirement.
            if (common.appConfig.enable2FA && common.appConfig.secret2FA && common.appConfig.secret2FA !== '' && !hasValidAuthToken(req)) {
                if (typeof twoFAToken !== 'string' || twoFAToken === '' || !verifyToken(twoFAToken)) {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Authenticate', msg: 'Invalid Token! Failed IP ' + reqIP, error: { error: 'Invalid token.' } });
                    failed.count = failed.count + 1;
                    failed.lastTried = currentTime;
                    return res.status(401).json(handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid 2FA Token!'));
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
            logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Authenticate', msg: 'Invalid Password! Failed IP ' + reqIP, error: { error: 'Invalid password.' } });
            failed.count = common.appConfig.rtlPass !== password ? (failed.count + 1) : failed.count;
            failed.lastTried = common.appConfig.rtlPass !== password ? currentTime : failed.lastTried;
            return res.status(401).json(handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid Password!'));
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

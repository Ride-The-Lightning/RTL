import jwt from 'jsonwebtoken';
import * as otplib from 'otplib';
import * as crypto from 'crypto';
import { Database, DatabaseService } from '../../utils/database.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';

const logger: LoggerService = Logger;
const common: CommonService = Common;
const ONE_MINUTE = 60000;
const LOCKING_PERIOD = 30 * ONE_MINUTE; // HALF AN HOUR
const ALLOWED_LOGIN_ATTEMPTS = 5;
const failedLoginAttempts = {};
const databaseService: DatabaseService = Database;

const loginInterval = setInterval(() => {
  for (const ip in failedLoginAttempts) {
    if (new Date().getTime() > (failedLoginAttempts[ip].lastTried + LOCKING_PERIOD)) {
      delete failedLoginAttempts[ip];
      clearInterval(loginInterval);
    }
  }
}, LOCKING_PERIOD);

export const getFailedInfo = (reqIP, currentTime) => {
  let failed = { count: 0, lastTried: currentTime };
  if ((!failedLoginAttempts[reqIP]) || (currentTime > (failed.lastTried + LOCKING_PERIOD))) {
    failed = { count: 0, lastTried: currentTime };
    failedLoginAttempts[reqIP] = failed;
  } else {
    failed = failedLoginAttempts[reqIP];
  }
  return failed;
};

const handleMultipleFailedAttemptsError = (failed, currentTime, errMsg) => {
  if (failed.count >= ALLOWED_LOGIN_ATTEMPTS && (currentTime <= (failed.lastTried + LOCKING_PERIOD))) {
    return {
      message: 'Multiple Failed Login Attempts!',
      error: 'Application locked for ' + (LOCKING_PERIOD / ONE_MINUTE) + ' minutes due to multiple failed attempts!\nTry again after ' + common.convertTimestampToTime((failed.lastTried + LOCKING_PERIOD) / 1000) + '!'
    };
  } else {
    return {
      message: 'Authentication Failed!',
      error: errMsg + '\nApplication will be locked after ' + (ALLOWED_LOGIN_ATTEMPTS - failed.count) + ' more unsuccessful attempts!'
    };
  }
};

export const verifyToken = (twoFAToken) => !!(common.rtl_secret2fa && common.rtl_secret2fa !== '' && otplib.authenticator.check(twoFAToken, common.rtl_secret2fa));

export const authenticateUser = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Authenticating User..' });
  if (+common.rtl_sso) {
    if (req.body.authenticateWith === 'JWT' && jwt.verify(req.body.authenticationValue, common.secret_key)) {
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated' });
      res.status(406).json({ message: 'SSO Authentication Error', error: 'Login with Password is not allowed with SSO.' });
    } else if (req.body.authenticateWith === 'PASSWORD') {
      if (common.cookie_value.trim().length >= 32 && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(common.cookie_value).digest('hex'), 'utf-8'), Buffer.from(req.body.authenticationValue, 'utf-8'))) {
        common.refreshCookie();
        if (!req.session.selectedNode) { req.session.selectedNode = common.initSelectedNode; }
        const token = jwt.sign({ user: 'SSO_USER' }, common.secret_key);
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated' });
        res.status(200).json({ token: token });
      } else {
        const errMsg = 'SSO Authentication Failed! Access key too short or does not match.';
        const err = common.handleError({ statusCode: 406, message: 'SSO Authentication Error', error: errMsg }, 'Authenticate', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      }
    }
  } else {
    const currentTime = new Date().getTime();
    const reqIP = common.getRequestIP(req);
    const failed = getFailedInfo(reqIP, currentTime);
    const password = req.body.authenticationValue;
    if (common.rtl_pass === password && failed.count < ALLOWED_LOGIN_ATTEMPTS) {
      if (req.body.twoFAToken && req.body.twoFAToken !== '') {
        if (!verifyToken(req.body.twoFAToken)) {
          logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Authenticate', msg: 'Invalid Token! Failed IP ' + reqIP, error: { error: 'Invalid token.' } });
          failed.count = failed.count + 1;
          failed.lastTried = currentTime;
          return res.status(401).json(handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid 2FA Token!'));
        }
      }
      if (!req.session.selectedNode) { req.session.selectedNode = common.initSelectedNode; }
      delete failedLoginAttempts[reqIP];
      const token = jwt.sign({ user: 'NODE_USER' }, common.secret_key);
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated' });
      res.status(200).json({ token: token });
    } else {
      logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Authenticate', msg: 'Invalid Password! Failed IP ' + reqIP, error: { error: 'Invalid password.' } });
      failed.count = common.rtl_pass !== password ? (failed.count + 1) : failed.count;
      failed.lastTried = common.rtl_pass !== password ? currentTime : failed.lastTried;
      return res.status(401).json(handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid Password!'));
    }
  }
};

export const resetPassword = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Resetting Password..' });
  if (+common.rtl_sso) {
    const errMsg = 'Password cannot be reset for SSO authentication';
    const err = common.handleError({ statusCode: 401, message: 'Password Reset Error', error: errMsg }, 'Authenticate', errMsg, req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  } else {
    const currPassword = req.body.currPassword;
    if (common.rtl_pass === currPassword) {
      common.rtl_pass = common.replacePasswordWithHash(req.body.newPassword);
      const token = jwt.sign({ user: 'NODE_USER' }, common.secret_key);
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Password Reset Successful' });
      res.status(200).json({ token: token });
    } else {
      const errMsg = 'Incorrect Old Password';
      const err = common.handleError({ statusCode: 401, message: 'Password Reset Error', error: errMsg }, 'Authenticate', errMsg, req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
  }
};

export const logoutUser = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Authenticate', msg: 'Logged out' });
  if (req.session.selectedNode && req.session.selectedNode.index) {
    databaseService.unloadDatabase(+req.session.selectedNode.index);
  }
  req.session.destroy((err) => {
    res.clearCookie('connect.sid');
    res.status(200).json({ loggedout: true });
  });
};

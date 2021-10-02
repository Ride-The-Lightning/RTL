var common = require('../../utils/common');
var config = require('../../utils/config');
var logger = require('../../utils/logger');
const jwt = require("jsonwebtoken");
const otplib = require("otplib");
var crypto = require('crypto');
var ONE_MINUTE = 60000;
var LOCKING_PERIOD = 30 * ONE_MINUTE; // HALF AN HOUR
var ALLOWED_LOGIN_ATTEMPTS = 5;
var failedLoginAttempts = {};

setInterval(() => {
  for (var ip in failedLoginAttempts) {
    if (new Date().getTime() > (failedLoginAttempts[ip].lastTried + LOCKING_PERIOD)) {
      delete failedLoginAttempts[ip];
    }
  }
}, LOCKING_PERIOD);

getFailedInfo = (reqIP, currentTime) => {
  let failed = failedLoginAttempts[reqIP] ? failedLoginAttempts[reqIP] : failedLoginAttempts[reqIP] = {count: 0, lastTried: currentTime};
  if (currentTime > (failed.lastTried + LOCKING_PERIOD)) {
    failed = failedLoginAttempts[reqIP] = {count: 0, lastTried: currentTime};
  }
  return failed;
}

handleMultipleFailedAttemptsError = (failed, currentTime, errMsg) => {
  if (failed.count >= ALLOWED_LOGIN_ATTEMPTS && (currentTime <= (failed.lastTried + LOCKING_PERIOD))) {
    return {
      message: "Multiple Failed Login Attempts!",
      error: "Application locked for " + (LOCKING_PERIOD/ONE_MINUTE)  + " minutes due to multiple failed attempts!\nTry again after " + common.convertTimestampToTime((failed.lastTried + LOCKING_PERIOD)/1000) + "!"
    };
  } else {
    return {
      message: "Authentication Failed!",
      error: errMsg + "\nApplication will be locked after " + (ALLOWED_LOGIN_ATTEMPTS - failed.count) + " more unsuccessful attempts!"
    };
  }
}

exports.verifyToken = (twoFAToken) => {
  if (common.rtl_secret2fa && common.rtl_secret2fa !== '' && otplib.authenticator.check(twoFAToken, common.rtl_secret2fa)) {
    return true;
  }
  return false;
};

exports.authenticateUser = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Authenticate', msg: 'Authenticating User..'});
  if (+common.rtl_sso) {
    if (req.body.authenticateWith === 'JWT' && jwt.verify(req.body.authenticationValue, common.secret_key)) {
      logger.log({level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated'});
      res.status(200).json({ token: token });
    } else if (req.body.authenticateWith === 'PASSWORD' && common.cookie.trim().length >= 32 && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(common.cookie).digest('hex'), 'utf-8'), Buffer.from(req.body.authenticationValue, 'utf-8'))) {
      config.refreshCookie(common.rtl_cookie_path);
      const token = jwt.sign({ user: 'SSO_USER' }, common.secret_key);
      logger.log({level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated.'});
      res.status(200).json({ token: token });
    } else {
      const errMsg = 'SSO Authentication Failed! Access key too short or does not match.';
      const err = common.handleError({ statusCode: 406, message: 'SSO Authentication Error', error: errMsg },  'Authenticate', errMsg);
      return res.status(err.statusCode).json({message: err.message, error: err.error});
    }
  } else {
    const currentTime = new Date().getTime();
    const reqIP = common.getRequestIP(req);
    let failed = getFailedInfo(reqIP, currentTime);
    const password = req.body.authenticationValue;
    if (common.rtl_pass === password && failed.count < ALLOWED_LOGIN_ATTEMPTS) {
      if (req.body.twoFAToken && req.body.twoFAToken !== '') {
        if (!this.verifyToken(req.body.twoFAToken)) {
          logger.log({level: 'ERROR', fileName: 'Authenticate', msg: 'Invalid Token! Failed IP ' + reqIP, error: {error: 'Invalid token.'}});
          failed.count = failed.count + 1;
          failed.lastTried = currentTime;
          return res.status(401).json(handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid 2FA Token!'));
        }
      }
      delete failedLoginAttempts[reqIP];
      const token = jwt.sign({ user: 'NODE_USER' }, common.secret_key);
      logger.log({level: 'INFO', fileName: 'Authenticate', msg: 'User Authenticated'});
      res.status(200).json({ token: token });
    } else {
      logger.log({level: 'ERROR', fileName: 'Authenticate', msg: 'Invalid Password! Failed IP ' + reqIP, error: {error: 'Invalid password.'}});
      failed.count = common.rtl_pass !== password ? (failed.count + 1) : failed.count;
      failed.lastTried = common.rtl_pass !== password ? currentTime : failed.lastTried;
      return res.status(401).json(handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid Password!'));
    }
  }
};

exports.resetPassword = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Authenticate', msg: 'Resetting Password..'});
  if (+common.rtl_sso) {
    const errMsg = 'Password cannot be reset for SSO authentication';
    const err = common.handleError({ statusCode: 401, message: 'Password Reset Error', error: errMsg },  'Authenticate', errMsg);
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  } else {
    const currPassword = req.body.currPassword;
    if (common.rtl_pass === currPassword) {
      common.rtl_pass = config.replacePasswordWithHash(req.body.newPassword);
      const token = jwt.sign({ user: 'NODE_USER' }, common.secret_key);
      logger.log({level: 'INFO', fileName: 'Authenticate', msg: 'Password Reset Successful'});
      res.status(200).json({ token: token });
    } else {
      const errMsg = 'Incorrect Old Password';
      const err = common.handleError({ statusCode: 401, message: 'Password Reset Error', error: errMsg },  'Authenticate', errMsg);
      return res.status(err.statusCode).json({message: err.message, error: err.error});
    }
  }
};

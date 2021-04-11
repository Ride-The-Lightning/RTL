var common = require('../../common');
var connect = require('../../connect');
var logger = require('./logger');
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

handleError = (failed, currentTime, errMsg) => {
  if (failed.count >= ALLOWED_LOGIN_ATTEMPTS && (currentTime <= (failed.lastTried + LOCKING_PERIOD))) {
    return {
      message: "Multiple Failed Login Attempts!",
      error: "Application locked for " + (LOCKING_PERIOD/ONE_MINUTE)  + " minutes due to multiple failed login attempts! Try again after " + common.convertTimestampToLocalDate((failed.lastTried + LOCKING_PERIOD)/1000) + "!"
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
  if(+common.rtl_sso) {
    if(req.body.authenticateWith === 'JWT' && jwt.verify(req.body.authenticationValue, common.secret_key)) {
      res.status(200).json({ token: token });
    } else if (req.body.authenticateWith === 'PASSWORD' && common.cookie.trim().length >= 32 && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(common.cookie).digest('hex'), 'utf-8'), Buffer.from(req.body.authenticationValue, 'utf-8'))) {
      connect.refreshCookie(common.rtl_cookie_path);
      const token = jwt.sign(
        { user: 'SSO_USER', configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 61, msg: 'SSO Authentication Failed! Access key too short or does not match.'});
      res.status(406).json({
        message: "SSO Authentication Failed!",
        error: "SSO failed. Access key too short or does not match."
      });
    }
  } else {
    const currentTime = new Date().getTime();
    const reqIP = common.getRequestIP(req);
    let failed = getFailedInfo(reqIP, currentTime);
    const password = req.body.authenticationValue;
    if (common.rtl_pass === password && failed.count < ALLOWED_LOGIN_ATTEMPTS) {
      if (req.body.twoFAToken && req.body.twoFAToken !== '') {
        if (!this.verifyToken(req.body.twoFAToken)) {
          logger.error({fileName: 'Authenticate', lineNum: 75, msg: 'Invalid Token! Failed IP ' + reqIP});
          failed.count = failed.count + 1;
          failed.lastTried = currentTime;
          return res.status(401).json(handleError(failed, currentTime, 'Invalid 2FA Token!'));
        }
      }
      delete failedLoginAttempts[reqIP];
      let rpcUser = 'NODE_USER';
      const token = jwt.sign(
        { user: rpcUser, configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 89, msg: 'Invalid Password! Failed IP ' + reqIP});
      failed.count = common.rtl_pass !== password ? (failed.count + 1) : failed.count;
      failed.lastTried = common.rtl_pass !== password ? currentTime : failed.lastTried;
      return res.status(401).json(handleError(failed, currentTime, 'Invalid Password!'));
    }
  }
};

exports.resetPassword = (req, res, next) => {
  if(+common.rtl_sso) {
    logger.error({fileName: 'Authenticate', lineNum: 99, msg: 'Password Reset Failed!'});
    res.status(401).json({
      message: "Password Reset Failed!",
      error: "Password cannot be reset for SSO authentication!"
    });
  } else {
    const currPassword = req.body.currPassword;
    if (common.rtl_pass === currPassword) {
      common.rtl_pass = connect.replacePasswordWithHash(req.body.newPassword);
      var rpcUser = 'NODE_USER';
      const token = jwt.sign(
        { user: rpcUser, configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 115, msg: 'Password Reset Failed!'});
      res.status(401).json({
        message: "Password Reset Failed!",
        error: "Old password is not correct!"
      });
    }
  }
};

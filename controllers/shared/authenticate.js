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

exports.authenticateUser = (req, res, next) => {
  if(+common.rtl_sso) {
    if(req.body.authenticateWith === 'TOKEN' && jwt.verify(req.body.authenticationValue, common.secret_key)) {
      res.status(200).json({ token: token });
    } else if (req.body.authenticateWith === 'PASSWORD' && crypto.createHash('sha256').update(common.cookie).digest('hex') === req.body.authenticationValue) {
      connect.refreshCookie(common.rtl_cookie_path);
      const token = jwt.sign(
        { user: 'SSO_USER', configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 20, msg: 'SSO Authentication Failed!'});
      res.status(406).json({
        message: "Login Failure!",
        error: "SSO Authentication Failed!"
      });
    }
  } else {
    const currentTime = new Date().getTime();
    const reqIP = common.getRequestIP(req);
    let failed = getFailedInfo(reqIP, currentTime);
    const password = req.body.authenticationValue;
    if (common.rtl_pass === password && failed.count < ALLOWED_LOGIN_ATTEMPTS) {
      delete failedLoginAttempts[reqIP];
      let rpcUser = 'NODE_USER';
      const token = jwt.sign(
        { user: rpcUser, configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 61, msg: 'Invalid Password! Failed IP ' + reqIP});
      failed.count = common.rtl_pass !== password ? (failed.count + 1) : failed.count;
      failed.lastTried = common.rtl_pass !== password ? currentTime : failed.lastTried;
      if (failed.count >= ALLOWED_LOGIN_ATTEMPTS && (currentTime <= (failed.lastTried + LOCKING_PERIOD))) {
        res.status(401).json({
          message: "Multiple Failed Login Attempts!",
          error: "Application locked for " + (LOCKING_PERIOD/ONE_MINUTE)  + " minutes due to multiple failed login attempts! Try again after " + common.convertTimestampToLocalDate((failed.lastTried + LOCKING_PERIOD)/1000) + "!"
        });
      } else {
        res.status(401).json({
          message: "Authentication Failed!",
          error: "Invalid password! Application will be locked after " + (ALLOWED_LOGIN_ATTEMPTS - failed.count) + " more unsuccessful attempts!"
        });
      }
    }
  }
};

exports.resetPassword = (req, res, next) => {
  if(+common.rtl_sso) {
    logger.error({fileName: 'Authenticate', lineNum: 47, msg: 'Password Reset Failed!'});
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
      logger.error({fileName: 'Authenticate', lineNum: 63, msg: 'Password Reset Failed!'});
      res.status(401).json({
        message: "Password Reset Failed!",
        error: "Old password is not correct!"
      });
    }
  }
};

exports.verifyToken = (req, res, next) => {
  const token2fa = req.body.authentication2FA;
  if (!common.rtl_secret2fa || otplib.authenticator.check(token2fa, common.rtl_secret2fa)) {
    res.status(200).json({ isValidToken: true });
  } else {
    logger.error({fileName: 'Authenticate', lineNum: 77, msg: 'Token Verification Failed!'});
    res.status(401).json({
      message: "Authentication Failed!",
      error: "Token Verification Failed!"
    });
  }
};

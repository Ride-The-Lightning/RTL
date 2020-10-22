var common = require('../common');
var connect = require('../connect');
const jwt = require("jsonwebtoken");
var crypto = require('crypto');
var logger = require('./logger');
const otplib = require("otplib");

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
    const password = req.body.authenticationValue;
    if (common.rtl_pass === password) {
      var rpcUser = 'NODE_USER';
      const token = jwt.sign(
        { user: rpcUser, configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 36, msg: 'Invalid Password!'});
      res.status(401).json({
        message: "Authentication Failed!",
        error: "Invalid Password!"
      });
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

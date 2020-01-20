var common = require('../common');
var connect = require('../connect');
const jwt = require("jsonwebtoken");
var crypto = require('crypto');
var logger = require('./logger');

exports.authenticateUser = (req, res, next) => {
  if(+common.rtl_sso) {
    if(req.body.authenticateWith === 'TOKEN' && jwt.verify(req.body.authenticationValue, common.secret_key)) {
      res.status(200).json({ token: token });
    } else if (req.body.authenticateWith === 'PASSWORD' && crypto.createHash('sha256').update(common.cookie).digest('hex') === req.body.authenticationValue) {
      connect.refreshCookie(common.rtl_cookie_path);
      const token = jwt.sign(
        { user: 'Custom_User', configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 21, msg: 'Password Validation Failed!'});
      res.status(401).json({
        message: "Login Failure!",
        error: "SSO Authentication Failed!"
      });
    }
  } else {
    const password = req.body.authenticationValue;
    if (common.rtl_pass === password) {
      var rpcUser = 'Node_User';
      const token = jwt.sign(
        { user: rpcUser, configPath: common.nodes[0].config_path, macaroonPath: common.nodes[0].macaroon_path },
        common.secret_key
      );
      res.status(200).json({ token: token });
    } else {
      logger.error({fileName: 'Authenticate', lineNum: 38, msg: 'Password Validation Failed!'});
      res.status(401).json({
        message: "Authentication Failed!",
        error: "Password Validation Failed!"
      });
    }
  }
};

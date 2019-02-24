var ini = require('ini');
var fs = require('fs');
var common = require('../common');
const jwt = require("jsonwebtoken");
var upperCase = require('upper-case');
var atob = require('atob');
var logger = require('./logger');

exports.authenticateUserWithCookie = (req, res, next) => {
  if(+common.rtl_sso) {
    res.cookie('access-key', req.query['access-key'], { signed: true, httpOnly: true, sameSite: true, secure: app.enabled('tls'), maxAge: 2592000000 });
    res.redirect(301, '/rtl/');
  }
  else
  {
    res.status(404).json({
      message: "Login Failure!",
      error: "SSO not available"
    });
  }
};

exports.authenticateUser = (req, res, next) => {
  if(+common.rtl_sso) {
    const access_key = req.cookies['access-key'];
    res.clearCookie("access-key");
    if (common.cookie === access_key) {
      const token = jwt.sign(
        { user: 'Custom_User', lndConfigPath: common.lnd_config_path, macaroonPath: common.macaroon_path },
        'default_secret_key'
      );
      res.status(200).json({ token: token });
    } else {
      res.status(401).json({
        message: "Login Failure!",
        error: "SSO Authentication Failed!"
      });
    }
  } else {
    password = atob(req.body.password);
    if(upperCase(common.node_auth_type) === 'CUSTOM') {
      if (common.rtl_pass === password) {
        var rpcUser = 'Custom_User';
        const token = jwt.sign(
          { user: rpcUser, lndConfigPath: common.lnd_config_path, macaroonPath: common.macaroon_path },
          'default_secret_key'
        );
        res.status(200).json({ token: token });
      } else {
        res.status(401).json({
          message: "Authentication Failed!",
          error: "Password Validation Failed!"
        });
      }
    } else {
      fs.readFile(common.lnd_config_path, 'utf8', function (err, data) {
        if (err) {
          logger.error('\r\nAuthenticate: 45: ' + JSON.stringify(Date.now()) + ': ERROR: RTL Config Reading Failed!');
          res.status(500).json({
            message: "LND Config Reading Failed!",
            error: err
          });
        } else {
          const jsonLNDConfig = ini.parse(data);
          if (undefined !== jsonLNDConfig.Bitcoind && undefined !== jsonLNDConfig.Bitcoind['bitcoind.rpcpass']) {
            if (jsonLNDConfig.Bitcoind['bitcoind.rpcpass'] === password) {
              var rpcUser = (undefined !== jsonLNDConfig.Bitcoind['bitcoind.rpcuser']) ? jsonLNDConfig.Bitcoind['bitcoind.rpcuser'] : '';
              const token = jwt.sign(
                { user: rpcUser, lndConfigPath: common.lnd_config_path, macaroonPath: common.macaroon_path },
                'default_secret_key'
              );
              res.status(200).json({ token: token });
            } else {
              res.status(401).json({
                message: "Authentication Failed!",
                error: "Password Validation Failed!"
              });
            }
          } else {
            res.status(401).json({
              message: "Authentication Failed!",
              error: "Password Not Found In LND Config!"
            });
          }
        }
      });
    }
  }
};

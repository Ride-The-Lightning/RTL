var ini = require('ini');
var fs = require('fs');
var common = require('../common');
const jwt = require("jsonwebtoken");
var upperCase = require('upper-case');
var atob = require('atob');
var logger = require('./logger');

exports.authenticateUser = (req, res, next) => {
  const RTLConfFilePath = common.rtl_conf_file_path + '/RTL.conf';
  password = atob(req.body.password);
  fs.readFile(RTLConfFilePath, 'utf8', function (err, data) {
    if (err) {
      logger.error('\r\nAuthenticate: 13: ' + JSON.stringify(Date.now()) + ': ERROR: RTL Config Reading Failed!');
      res.status(500).json({
        message: "RTL Config Reading Failed!",
        error: err
      });
    } else {
      const nodeAuthType = common.node_auth_type;
      const macaroonPath = common.macaroon_path;
      const lndConfigPath = (undefined !== common.lnd_config_path) ? common.lnd_config_path : '';
      if(upperCase(nodeAuthType) === 'CUSTOM') {
        const rtlPass = ini.parse(data).Authentication.rtlPass;
        if (rtlPass === password) {
          var rpcUser = 'Custom_User';
          const token = jwt.sign(
            { user: rpcUser, lndConfigPath: lndConfigPath, macaroonPath: macaroonPath },
            'RTL_default_secret_it_can_be_changed_by_user',
            { expiresIn: "1h" }
          );
          res.status(200).json({
            token: token,
            expiresIn: 3600
          });
        } else {
          res.status(401).json({
            message: "Authentication Failed!",
            error: "Password Validation Failed!"
          });
        }
      } else {
        fs.readFile(lndConfigPath, 'utf8', function (err, data) {
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
                  { user: rpcUser, lndConfigPath: lndConfigPath, macaroonPath: macaroonPath },
                  'RTL_default_secret_it_can_be_changed_by_user',
                  { expiresIn: "1h" }
                );
                res.status(200).json({
                  token: token,
                  expiresIn: 3600
                });
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
  })
};

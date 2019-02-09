var ini = require('ini');
var path = require('path');
var fs = require('fs');
var logger = require('./logger');
var common = require('../common');
var RTLConfFilePath = common.rtl_conf_file_path + '/RTL.conf';

exports.getRTLConfig = (req, res, next) => {
  logger.info('\r\nConf: 7: ' + JSON.stringify(Date.now()) + ': INFO: Getting RTL Config');
  fs.readFile(RTLConfFilePath, 'utf8', function(err, data) {
    if (err) {
      logger.error('\r\nConf: 10: ' + JSON.stringify(Date.now()) + ': ERROR: Getting RTL Config Failed!');
      res.status(500).json({
        message: "Reading RTL Config Failed!",
        error: err
      });
    } else {
      const jsonConfig = ini.parse(data);
      authSettings = {
        nodeAuthType: (common.node_auth_type) ? common.node_auth_type : 'DEFAULT',
        lndConfigPath: (common.lnd_config_path) ? common.lnd_config_path : '',
        bitcoindConfigPath: (common.bitcoind_config_path) ? common.bitcoind_config_path : ''
      };
      res.status(200).json({settings: jsonConfig.Settings, authSettings: authSettings});
    }
  });
};

exports.updateUISettings = (req, res, next) => {
  var config = ini.parse(fs.readFileSync(RTLConfFilePath, 'utf-8'));
  delete config.Settings;
  fs.writeFileSync(RTLConfFilePath, ini.stringify(config));
  fs.appendFile(RTLConfFilePath, ini.stringify(req.body.updatedSettings, { section: 'Settings' }), function(err) {
    if (err) {
      logger.error('\r\nConf: 28: ' + JSON.stringify(Date.now()) + ': ERROR: Updating UI Settings Failed!');
      res.status(500).json({
        message: "Updating UI Settings Failed!",
        error: 'Updating UI Settings Failed!'
      });
    } else {
      logger.info('\r\nConf: 34: ' + JSON.stringify(Date.now()) + ': INFO: Updating UI Settings Succesful!');
      res.status(201).json({message: 'UI Settings Updated Successfully'});
    }
  });
};

exports.getConfig = (req, res, next) => {
  let confFilePath = '';
  switch (req.params.nodeType) {
    case 'lnd':
      confFilePath = common.lnd_config_path
      break;
    case 'bitcoind':
      confFilePath = common.bitcoind_config_path
      break;
    case 'rtl':
      confFilePath = RTLConfFilePath;
      break;
    default:
      confFilePath = '';
      break;
  }
  logger.info('\r\nConf: 43: ' + JSON.stringify(Date.now()) + ': INFO: Node Type: ' + req.params.nodeType + ', File Path: ' + confFilePath);
  fs.readFile(confFilePath, 'utf8', function(err, data) {
    if (err) {
      logger.error('\r\nConf: 59: ' + JSON.stringify(Date.now()) + ': ERROR: Reading Conf Failed!');
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      const jsonConfig = ini.parse(data);
      if (undefined !== jsonConfig.Authentication && undefined !== jsonConfig.Authentication.rtlPass) {
        jsonConfig.Authentication.rtlPass = jsonConfig.Authentication.rtlPass.replace(/./g, '*');
      }
      if (undefined !== jsonConfig.Bitcoind && undefined !== jsonConfig.Bitcoind['bitcoind.rpcpass']) {
        jsonConfig.Bitcoind['bitcoind.rpcpass'] = jsonConfig.Bitcoind['bitcoind.rpcpass'].replace(/./g, '*');
      }
      res.status(200).json(ini.stringify(jsonConfig));
    }
  });
};

var ini = require('ini');
var path = require('path');
var fs = require('fs');
var file_path = path.normalize(__dirname + '/..') + '/RTL.conf';  
var logger = require('./logger');
var common = require('../common');

exports.getRTLConfig = (req, res, next) => {
  logger.info('\r\nConf: 7: ' + JSON.stringify(Date.now()) + ': INFO: Getting RTL Config');
  fs.readFile(file_path, 'utf8', function(err, data) {
    if (err) {
      logger.error('\r\nConf: 10: ' + JSON.stringify(Date.now()) + ': ERROR: Getting RTL Config Failed!');
      res.status(500).json({
        message: "Reading RTL Config Failed!",
        error: err
      });
    } else {
      const jsonConfig = ini.parse(data);
      authSettings = {
        nodeAuthType: (jsonConfig.Authentication.nodeAuthType) ? jsonConfig.Authentication.nodeAuthType : 'DEFAULT',
        lndConfigPath: (jsonConfig.Authentication.lndConfigPath) ? jsonConfig.Authentication.lndConfigPath : '',
        bitcoindConfigPath: (jsonConfig.Authentication.bitcoindConfigPath) ? jsonConfig.Authentication.bitcoindConfigPath : ''
      };
      res.status(200).json({settings: jsonConfig.Settings, authSettings: authSettings});
    }
  });
};

exports.updateUISettings = (req, res, next) => {
  var config = ini.parse(fs.readFileSync(file_path, 'utf-8'));
  delete config.Settings;
  fs.writeFileSync(file_path, ini.stringify(config));
  fs.appendFile(file_path, ini.stringify(req.body.updatedSettings, { section: 'Settings' }), function(err) {
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
      confFilePath = file_path;
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

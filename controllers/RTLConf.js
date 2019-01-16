var ini = require('ini');
var path = require('path');
var fs = require('fs');
var file_path = path.normalize(__dirname + '/..') + '/RTL.conf';  
var logger = require('./logger');

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
      res.status(200).json({settings: jsonConfig.Settings, nodeAuthType: (jsonConfig.Authentication.nodeAuthType) ? jsonConfig.Authentication.nodeAuthType : 'DEFAULT'});
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

exports.getLNDConfig = (req, res, next) => {
  fs.readFile(req.headers.filepath, 'utf8', function(err, data) {
    if (err) {
      logger.error('\r\nConf: 43: ' + JSON.stringify(Date.now()) + ': ERROR: Reading Conf Failed!');
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      const jsonConfig = ini.parse(data);
      if (undefined !== jsonConfig.Bitcoind && undefined !== jsonConfig.Bitcoind['bitcoind.rpcpass']) {
        jsonConfig.Bitcoind['bitcoind.rpcpass'] = jsonConfig.Bitcoind['bitcoind.rpcpass'].replace(/./g, '*');
      }
      res.status(200).json(ini.stringify(jsonConfig));
    }
  });
};

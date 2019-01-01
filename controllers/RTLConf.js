var ini = require('ini');
var path = require('path');
var fs = require('fs');
var file_path = path.normalize(__dirname + '/..') + '/RTL.conf';  

exports.getUISettings = (req, res, next) => {
  console.log('Getting UI Settings!');
  fs.readFile(file_path, 'utf8', function(err, data) {
    if (err) {
      console.log('Reading UI Settings Failed!');
      res.status(500).json({
        message: "Reading UI Settings Failed!",
        error: err
      });
    } else {
      const jsonConfig = ini.parse(data);
      console.log('UI settings read successfully');
      res.status(200).json({settings: jsonConfig.Settings});
    }
  });
};

exports.updateUISettings = (req, res, next) => {
  var config = ini.parse(fs.readFileSync(file_path, 'utf-8'));
  delete config.Settings;
  fs.writeFileSync(file_path, ini.stringify(config));
  fs.appendFile(file_path, ini.stringify(req.body.updatedSettings, { section: 'Settings' }), function(err) {
    if (err) {
      console.log('Updating UI Settings Failed!');
      res.status(500).json({
        message: "Updating UI Settings Failed!",
        error: 'Updating UI Settings Failed!'
      });
    } else {
      console.log('UI Settings Updated Successfully');
      res.status(201).json({message: 'UI Settings Updated Successfully'});
    }
  });
};

exports.getLNDConfig = (req, res, next) => {
  console.log('Getting LND Conf Settings!');
  fs.readFile(req.headers.filepath, 'utf8', function(err, data) {
    if (err) {
      console.log('Reading Config File Failed!');
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      const jsonConfig = ini.parse(data);
      console.log('LND Conf read successfully');
      if (undefined !== jsonConfig.Bitcoind && undefined !== jsonConfig.Bitcoind['bitcoind.rpcpass']) {
        jsonConfig.Bitcoind['bitcoind.rpcpass'] = jsonConfig.Bitcoind['bitcoind.rpcpass'].replace(/./g, '*');
      }
      res.status(200).json(ini.stringify(jsonConfig));
    }
  });
};

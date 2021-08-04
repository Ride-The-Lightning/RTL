var ini = require('ini');
var parseHocon = require('hocon-parser');
var fs = require('fs');
var logger = require('./logger');
var common = require('../../routes/common');
var request = require('request-promise');
var options = {};

exports.updateSelectedNode = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Updating Selected Node..'});
  const selNodeIndex = req.body.selNodeIndex;
  common.selectedNode = common.findNode(selNodeIndex);
  const responseVal = common.selectedNode && common.selectedNode.ln_node ? common.selectedNode.ln_node : '';
  logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: 'Selected Node Updated To', data: responseVal});
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Selected Node Updated'});
  res.status(200).json({status: 'Selected Node Updated To: ' + JSON.stringify(responseVal) + '!'});
};

exports.getRTLConfig = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Getting RTL Configuration..'});
  var confFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: 'Getting Node Config'});
  fs.readFile(confFile, 'utf8', function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Node config does not exist!', error: {error: 'Node config does not exist.'}});
        res.status(200).json({ defaultNodeIndex: 0, selectedNodeIndex: 0, sso: {}, nodes: [] });
      } else {
        logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Getting Node Config Failed!', error: err});
        res.status(500).json({
          message: "Reading Node Config Failed!",
          error: err
        });
      }
    } else {
      const nodeConfData = JSON.parse(data);
      const sso = { rtlSSO: common.rtl_sso, logoutRedirectLink: common.logout_redirect_link };
      const enable2FA = !common.rtl_secret2fa ? false : true;
      var nodesArr = [];
      if (common.nodes && common.nodes.length > 0) {
        common.nodes.forEach((node, i) => {
          const authentication = {};
          authentication.configPath = (node.config_path) ? node.config_path : '';
          authentication.swapMacaroonPath = (node.swap_macaroon_path) ? node.swap_macaroon_path : '';
          authentication.boltzMacaroonPath = (node.boltz_macaroon_path) ? node.boltz_macaroon_path : '';
          const settings = {};
          settings.userPersona = node.user_persona ? node.user_persona : 'MERCHANT';
          settings.themeMode = (node.theme_mode) ? node.theme_mode : 'DAY';
          settings.themeColor = (node.theme_color) ? node.theme_color : 'PURPLE';
          settings.fiatConversion = (node.fiat_conversion) ? !!node.fiat_conversion : false;
          settings.bitcoindConfigPath = node.bitcoind_config_path;
          settings.logLevel = node.log_level ? node.log_level : 'ERROR';
          settings.lnServerUrl = node.ln_server_url;
          settings.swapServerUrl = node.swap_server_url;
          settings.boltzServerUrl = node.boltz_server_url;
          settings.channelBackupPath = node.channel_backup_path;
          settings.currencyUnit = node.currency_unit;
          nodesArr.push({
            index: node.index,
            lnNode: node.ln_node,
            lnImplementation: node.ln_implementation,
            settings: settings,
            authentication: authentication})
        });
      }
      logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'RTL Configuration Received'});
      res.status(200).json({ defaultNodeIndex: nodeConfData.defaultNodeIndex, selectedNodeIndex: common.selectedNode.index, sso: sso, enable2FA: enable2FA, nodes: nodesArr });
    }
  });
};

exports.updateUISettings = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Updating UI Settings..'});
  var RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  config.nodes.find(node => {
    if(node.index == common.selectedNode.index) {
      node.Settings.userPersona = req.body.updatedSettings.userPersona;
      node.Settings.themeMode = req.body.updatedSettings.themeMode;
      node.Settings.themeColor = req.body.updatedSettings.themeColor;
      node.Settings.fiatConversion = req.body.updatedSettings.fiatConversion;
      if(req.body.updatedSettings.fiatConversion) {
        node.Settings.currencyUnit = req.body.updatedSettings.currencyUnit ? req.body.updatedSettings.currencyUnit : 'USD';
      } else {
        delete node.Settings.currencyUnit;
      }
      const selectedNode = common.findNode(common.selectedNode.index);
      selectedNode.user_persona = req.body.updatedSettings.userPersona;
      selectedNode.theme_mode = req.body.updatedSettings.themeMode;
      selectedNode.theme_color = req.body.updatedSettings.themeColor;
      selectedNode.fiat_conversion = req.body.updatedSettings.fiatConversion;
      if(req.body.updatedSettings.fiatConversion) {
        selectedNode.currency_unit = req.body.updatedSettings.currencyUnit ? req.body.updatedSettings.currencyUnit : 'USD';
      } else {
        delete selectedNode.currency_unit;
      }
      common.replaceNode(common.selectedNode.index, selectedNode);
    }
  });
  try {
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: 'Updating Node Settings Succesful!'});
    logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'UI Settings Updated'});
    res.status(201).json({message: 'Node Settings Updated Successfully'});
  }
  catch (err) {
    logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Updating Node Settings Failed!', error: {error: 'Updating node settings failed.'}});
    res.status(500).json({
      message: "Updating Node Settings Failed!",
      error: 'Updating Node Settings Failed!'
    });
  }
};

exports.update2FASettings = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Updating 2FA Settings..'});
  var RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  config.secret2fa = req.body.secret2fa;
  let message = req.body.secret2fa.trim() === '' ? 'Two factor authentication disabled sucessfully.' : 'Two factor authentication enabled sucessfully.';
  try {
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    common.rtl_secret2fa = config.secret2fa;
    logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: message});
    logger.log({level: 'INFO', fileName: 'RTLConf', msg: '2FA Updated'});
    res.status(201).json({message: message});
  }
  catch (err) {
    logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Updating 2FA Settings Failed!', error: {error: 'Updating 2FA settings failed.'}});
    res.status(500).json({
      message: "Updating 2FA Settings Failed!",
      error: 'Updating 2FA Settings Failed!'
    });
  }
};

exports.updateDefaultNode = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Updating Default Node..'});
  RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  config.defaultNodeIndex = req.body.defaultNodeIndex;
  try {
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: 'Updating Default Node Succesful!'});
    logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Default Node Updated'});
    res.status(201).json({message: 'Default Node Updated Successfully'});
  }
  catch (err) {
    logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Updating Default Node Failed!', error: {error: 'Updating dafault node failed.'}});
    res.status(500).json({
      message: "Updating Default Node Failed!",
      error: 'Updating Default Node Failed!'
    });
  }
};

exports.getConfig = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Reading Configuration File..'});
  let confFile = '';
  let fileFormat = 'INI';
  switch (req.params.nodeType) {
    case 'ln':
      confFile = common.selectedNode.config_path;
      break;
    case 'bitcoind':
      confFile = common.selectedNode.bitcoind_config_path;
      break;
    case 'rtl':
      fileFormat = 'JSON';
      confFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
      break;
    default:
      confFile = '';
      break;
  }
  logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: '[Node Type, File Path]', data: [req.params.nodeType, confFile]});
  fs.readFile(confFile, 'utf8', function(err, data) {
    if (err) {
      logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Reading Conf Failed!', error: err});
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      let jsonConfig = {};
      if (fileFormat === 'JSON') {
        jsonConfig = JSON.parse(data);
      } else {
        fileFormat = 'INI';
        jsonConfig = ini.parse(data);
        if (common.selectedNode.ln_implementation === 'ECL' && !jsonConfig['eclair.api.password']) {
          fileFormat = 'HOCON';
          jsonConfig = parseHocon(data);
        }
      }
      jsonConfig = maskPasswords(jsonConfig);
      const responseJSON = (fileFormat === 'JSON') ? jsonConfig : ini.stringify(jsonConfig);
      logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Configuration Data Received'});
      res.status(200).json({format: fileFormat, data: responseJSON});
    }
  });
};

exports.getFile = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Getting File..'});
  let file = req.query.path ? req.query.path : (common.selectedNode.channel_backup_path + common.path_separator + 'channel-' + req.query.channel.replace(':', '-') + '.bak');
  logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: '[Channel Point, File Path]', data: [req.query.channel, file]});
  fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
      logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Reading File Failed!', error: err});
      if (err.code && err.code === 'ENOENT') {
        err.code = 'Backup File Not Found!';
      }
      res.status(500).json({
        message: "Reading File Failed!",
        error: err
      });
    } else {
      logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: 'File Data', data: data});
      logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'File Data Received'});
      res.status(200).json(data);
    }
  });
};

exports.getCurrencyRates = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Getting Currency Rates..'});
  options.url = 'https://blockchain.info/ticker';
  request(options).then((body) => {
    if(!body || body.error) {
      res.status(500).json({
        message: "Fetching Rates Failed!",
        error: (!body) ? 'Error From External Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Currency Rates Received'});
      res.status(200).json(JSON.parse(body));
    }
  })
  .catch(function (err) {
    logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Fetching Rates Failed!', error: err});
    return res.status(500).json({
      message: "Fetching Rates Failed!",
      error: err.error
    });
  });
};

exports.updateSSO = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Updating SSO Settings..'});
  RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  delete config.SSO;
  config.SSO = req.body.SSO;
  try {
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: 'Updating SSO Succesful!'});
    logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'SSO Setting Updated'});
    res.status(201).json({message: 'SSO Updated Successfully'});
  }
  catch (err) {
    logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Updating SSO Failed!', error: {error: 'Updating SSO failed.'}});
    res.status(500).json({
      message: "Updating SSO Failed!",
      error: 'Updating SSO Failed!'
    });
  }
};

exports.updateServiceSettings = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Updating Service Settings..'});
  var RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  const selectedNode = common.findNode(common.selectedNode.index);
  config.nodes.find(node => {
    if(node.index == common.selectedNode.index) {
      switch (req.body.service) {
        case 'LOOP':
          if (req.body.settings.enable) {
            node.Settings.swapServerUrl = req.body.settings.serverUrl;
            node.Authentication.swapMacaroonPath = req.body.settings.macaroonPath;
            selectedNode.swap_server_url = req.body.settings.serverUrl;
            selectedNode.swap_macaroon_path = req.body.settings.macaroonPath;
          } else {
            delete node.Settings.swapServerUrl;
            delete node.Authentication.swapMacaroonPath;
            delete selectedNode.swap_server_url;
            delete selectedNode.swap_macaroon_path;
          }
          break;
      
        case 'BOLTZ':
          if (req.body.settings.enable) {
            node.Settings.boltzServerUrl = req.body.settings.serverUrl;
            node.Authentication.boltzMacaroonPath = req.body.settings.macaroonPath;
            selectedNode.boltz_server_url = req.body.settings.serverUrl;
            selectedNode.boltz_macaroon_path = req.body.settings.macaroonPath;
          } else {
            delete node.Settings.boltzServerUrl;
            delete node.Authentication.boltzMacaroonPath;
            delete selectedNode.boltz_server_url;
            delete selectedNode.boltz_macaroon_path;
          }
          break;

        default:
          break;
      }
      common.replaceNode(common.selectedNode.index, selectedNode);
    }
  });
  try {
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    logger.log({level: 'DEBUG', fileName: 'RTLConf', msg: 'Updating Service Settings Succesful!'});
    logger.log({level: 'INFO', fileName: 'RTLConf', msg: 'Service Settings Updated'});
    res.status(201).json({message: 'Service Settings Updated Successfully'});
  }
  catch (err) {
    logger.log({level: 'ERROR', fileName: 'RTLConf', msg: 'Updating Service Settings Failed!', error: {error: 'Updating service settings failed.'}});
    res.status(500).json({
      message: "Updating Service Settings Failed!",
      error: 'Updating Service Settings Failed!'
    });
  }
};

var maskPasswords = function(obj) {
  var keys = Object.keys(obj);
  var length = keys.length;
  if (length !== 0) {
    for (var i = 0; i < length; i++) {
      if (typeof obj[keys[i]] === 'object') {
        keys[keys[i]] = maskPasswords(obj[keys[i]]);
      }
      if (typeof keys[i] === 'string'
        && (keys[i].toLowerCase().includes('password') || keys[i].toLowerCase().includes('multipass')
          || keys[i].toLowerCase().includes('rpcpass') || keys[i].toLowerCase().includes('rpcpassword'))
      ) {
        obj[keys[i]] = '********************';
      }
    }
  }
  return obj;
};

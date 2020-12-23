var ini = require('ini');
var parseHocon = require('hocon-parser');
var fs = require('fs');
var logger = require('./logger');
var common = require('../../common');
var request = require('request-promise');
var options = {};

exports.updateSelectedNode = (req, res, next) => {
  const selNodeIndex = req.body.selNodeIndex;
  common.selectedNode = common.findNode(selNodeIndex);
  const responseVal = common.selectedNode && common.selectedNode.ln_node ? common.selectedNode.ln_node : '';
  logger.info({fileName: 'RTLConf', msg: 'Selected Node Updated To: ' + JSON.stringify(responseVal)});
  res.status(200).json({status: 'Selected Node Updated To: ' + JSON.stringify(responseVal) + '!'});
};

exports.getRTLConfig = (req, res, next) => {
  var confFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  logger.info({fileName: 'RTLConf', msg: 'Getting Node Config'});
  fs.readFile(confFile, 'utf8', function(err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        logger.error({fileName: 'RTLConf', lineNum: 22, msg: 'Node config does not exist!'});
        res.status(200).json({ defaultNodeIndex: 0, selectedNodeIndex: 0, sso: {}, nodes: [] });
      } else {
        logger.error({fileName: 'RTLConf', lineNum: 25, msg: 'Getting Node Config Failed!'});
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
          if(node.config_path) {
            authentication.configPath = node.config_path;
          } else {
            authentication.configPath = '';
          }
          const settings = {};
          settings.userPersona = node.user_persona ? node.user_persona : 'MERCHANT';
          settings.themeMode = (node.theme_mode) ? node.theme_mode : 'DAY';
          settings.themeColor = (node.theme_color) ? node.theme_color : 'PURPLE';
          settings.fiatConversion = (node.fiat_conversion) ? !!node.fiat_conversion : false;
          settings.bitcoindConfigPath = node.bitcoind_config_path;
          settings.enableLogging = node.enable_logging ? !!node.enable_logging : false;
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
      res.status(200).json({ defaultNodeIndex: nodeConfData.defaultNodeIndex, selectedNodeIndex: common.selectedNode.index, sso: sso, enable2FA: enable2FA, nodes: nodesArr });
    }
  });
};

exports.updateUISettings = (req, res, next) => {
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
    logger.info({fileName: 'RTLConf', msg: 'Updating Application Node Settings Succesful!'});
    res.status(201).json({message: 'Application Node Settings Updated Successfully'});
  }
  catch (err) {
    logger.error({fileName: 'Conf', lineNum: 101, msg: 'Updating Application Node Settings Failed!'});
    res.status(500).json({
      message: "Updating Application Node Settings Failed!",
      error: 'Updating Application Node Settings Failed!'
    });
  }
};

exports.update2FASettings = (req, res, next) => {
  var RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  config.secret2fa = req.body.secret2fa;
  let message = req.body.secret2fa.trim() === '' ? 'Two factor authentication disabled sucessfully.' : 'Two factor authentication enabled sucessfully.';
  try {
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    common.rtl_secret2fa = config.secret2fa;
    logger.info({fileName: 'RTLConf', msg: message});
    res.status(201).json({message: message});
  }
  catch (err) {
    logger.error({fileName: 'Conf', lineNum: 121, msg: 'Updating 2FA Settings Failed!'});
    res.status(500).json({
      message: "Updating 2FA Settings Failed!",
      error: 'Updating 2FA Settings Failed!'
    });
  }
};

exports.updateDefaultNode = (req, res, next) => {
  RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  config.defaultNodeIndex = req.body.defaultNodeIndex;
  try {
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    logger.info({fileName: 'RTLConf', msg: 'Updating Default Node Succesful!'});
    res.status(201).json({message: 'Default Node Updated Successfully'});
  }
  catch (err) {
    logger.error({fileName: 'Conf', lineNum: 139, msg: 'Updating Default Node Failed!'});
    res.status(500).json({
      message: "Updating Default Node Failed!",
      error: 'Updating Default Node Failed!'
    });
  }
};

exports.getConfig = (req, res, next) => {
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
  logger.info({fileName: 'RTLConf', msg: 'Node Type: ' + req.params.nodeType + ', File Path: ' + confFile});
  fs.readFile(confFile, 'utf8', function(err, data) {
    if (err) {
      logger.error({fileName: 'Conf', lineNum: 171, msg: 'Reading Conf Failed!'});
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      let jsonConfig = {};
      if (fileFormat === 'JSON') {
        jsonConfig = JSON.parse(data);
      } else {
        jsonConfig = ini.parse(data);
        console.warn();
        console.warn(jsonConfig);
        switch (common.selectedNode.ln_implementation) {
          case 'ECL':
            if (jsonConfig['eclair.api.password']) {
              if (jsonConfig['eclair.api.password']) {
                jsonConfig['eclair.api.password'] = jsonConfig['eclair.api.password'].replace(/./g, '*');
              }      
              if (jsonConfig['eclair.bitcoind.rpcpassword']) {
                jsonConfig['eclair.bitcoind.rpcpassword'] = jsonConfig['eclair.bitcoind.rpcpassword'].replace(/./g, '*');
              }      
            } else {
              fileFormat = 'HOCON';
              jsonConfig = parseHocon(data);
              if (jsonConfig.eclair && jsonConfig.eclair.api && jsonConfig.eclair.api.password) {
                jsonConfig.eclair.api.password = jsonConfig.eclair.api.password.replace(/./g, '*');
              }      
              if (jsonConfig.eclair && jsonConfig.eclair.bitcoind && jsonConfig.eclair.bitcoind.rpcpassword) {
                jsonConfig.eclair.bitcoind.rpcpassword = jsonConfig.eclair.bitcoind.rpcpassword.replace(/./g, '*');
              }      
            }
            break;
        
         default:
            fileFormat = 'INI';
            break;
        }
      }
      if (jsonConfig.Bitcoind && jsonConfig.Bitcoind['bitcoind.rpcpass']) {
        jsonConfig.Bitcoind['bitcoind.rpcpass'] = jsonConfig.Bitcoind['bitcoind.rpcpass'].replace(/./g, '*');
      }
      if (jsonConfig['bitcoind.rpcpass']) {
        jsonConfig['bitcoind.rpcpass'] = jsonConfig['bitcoind.rpcpass'].replace(/./g, '*');
      }
      if (jsonConfig['rpcpassword']) {
        jsonConfig['rpcpassword'] = jsonConfig['rpcpassword'].replace(/./g, '*');
      }
      if (jsonConfig.multiPass) {
        jsonConfig.multiPass = jsonConfig.multiPass.replace(/./g, '*');
      }
      const responseJSON = (fileFormat === 'JSON') ? jsonConfig : ini.stringify(jsonConfig);
      res.status(200).json({format: fileFormat, data: responseJSON});
    }
  });
};

exports.getFile = (req, res, next) => {
  let file = req.query.path ? req.query.path : (common.selectedNode.channel_backup_path + common.path_separator + 'channel-' + req.query.channel.replace(':', '-') + '.bak');
  logger.info({fileName: 'Conf', msg: 'Channel Point: ' + req.query.channel + ', File Path: ' + file});
  fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
      logger.error({fileName: 'Conf', lineNum: 207, msg: 'Reading File Failed!' + JSON.stringify(err)});
      if (err.code && err.code === 'ENOENT') {
        err.code = 'Backup File Not Found!';
      }
      res.status(500).json({
        message: "Reading File Failed!",
        error: err
      });
    } else {
      logger.info({fileName: 'Conf', msg: 'File Data: ' + data});
      res.status(200).json(data);
    }
  });
};

exports.getCurrencyRates = (req, res, next) => {
  options.url = 'https://blockchain.info/ticker';
  request(options).then((body) => {
    if(!body || body.error) {
      res.status(500).json({
        message: "Fetching Rates Failed!",
        error: (!body) ? 'Error From External Server!' : body.error
      });
    } else {
      res.status(200).json(body);
      body = JSON.parse(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Conf', lineNum: 210, msg: 'Fetching Rates Failed! ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Rates Failed!",
      error: err.error
    });
  });
};
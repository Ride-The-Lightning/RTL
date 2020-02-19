var ini = require('ini');
var fs = require('fs');
var logger = require('./logger');
var common = require('../common');
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
        logger.error({fileName: 'RTLConf', lineNum: 46, msg: 'Node config does not exist!'});
        res.status(200).json({ defaultNodeIndex: 0, selectedNodeIndex: 0, sso: {}, nodes: [] });
      } else {
        logger.error({fileName: 'RTLConf', lineNum: 49, msg: 'Getting Node Config Failed!'});
        res.status(500).json({
          message: "Reading Node Config Failed!",
          error: err
        });
      }
    } else {
      const nodeConfData = JSON.parse(data);
      const sso = { rtlSSO: common.rtl_sso, logoutRedirectLink: common.logout_redirect_link };
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
      res.status(200).json({ defaultNodeIndex: nodeConfData.defaultNodeIndex, selectedNodeIndex: common.selectedNode.index, sso: sso, nodes: nodesArr });
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
    logger.error({fileName: 'Conf', lineNum: 102, msg: 'Updating Application Node Settings Failed!'});
    res.status(500).json({
      message: "Updating Application Node Settings Failed!",
      error: 'Updating Application Node Settings Failed!'
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
    logger.error({fileName: 'Conf', lineNum: 102, msg: 'Updating Default Node Failed!'});
    res.status(500).json({
      message: "Updating Default Node Failed!",
      error: 'Updating Default Node Failed!'
    });
  }
};

exports.getConfig = (req, res, next) => {
  let confFile = '';
  let JSONFormat = false;
  switch (req.params.nodeType) {
    case 'ln':
      JSONFormat = false;
      confFile = common.selectedNode.config_path;
      break;
    case 'bitcoind':
      JSONFormat = false;
      confFile = common.selectedNode.bitcoind_config_path;
      break;
    case 'rtl':
      JSONFormat = true;
      confFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
      break;
    default:
      JSONFormat = false;
      confFile = '';
      break;
  }
  logger.info({fileName: 'RTLConf', msg: 'Node Type: ' + req.params.nodeType + ', File Path: ' + confFile});
  fs.readFile(confFile, 'utf8', function(err, data) {
    if (err) {
      logger.error({fileName: 'Conf', lineNum: 159, msg: 'Reading Conf Failed!'});
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      const jsonConfig = (JSONFormat) ? JSON.parse(data) : ini.parse(data);
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
      const responseJSON = (JSONFormat) ? jsonConfig : ini.stringify(jsonConfig);
      res.status(200).json({format: (JSONFormat) ? 'JSON' : 'INI', data: responseJSON});
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
    logger.error({fileName: 'Conf', lineNum: 241, msg: 'Fetching Rates Failed! ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Rates Failed!",
      error: err.error
    });
  });
};
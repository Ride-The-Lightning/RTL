var ini = require('ini');
var fs = require('fs');
var logger = require('./logger');
var common = require('../common');

exports.updateSelectedNode = (req, res, next) => {
  const selNodeIndex = req.body.selNodeIndex;
  common.selectedNode = common.findNode(selNodeIndex);
  const responseVal = common.selectedNode.ln_node ? common.selectedNode.ln_node : common.selectedNode.ln_server_url;
  logger.info({fileName: 'RTLConf', msg: 'Selected Node Updated To: ' + JSON.stringify(responseVal)});
  res.status(200).json({status: 'Selected Node Updated To: ' + JSON.stringify(responseVal) + '!'});
};

exports.getRTLConfig = (req, res, next) => {
  if(!common.multi_node_setup) {
    var RTLConfFile = common.rtl_conf_file_path + '/RTL.conf';
    logger.info({fileName: 'RTLConf', msg: 'Getting RTL Config'});
    fs.readFile(RTLConfFile, 'utf8', function(err, data) {
      if (err) {
        logger.error({fileName: 'RTLConf', lineNum: 19, msg: 'Getting RTL Config Failed!'});
        res.status(500).json({
          message: "Reading RTL Config Failed!",
          error: err
        });
      } else {
        const jsonConfig = ini.parse(data);
        const sso = { rtlSSO: common.rtl_sso, logoutRedirectLink: common.logout_redirect_link };
        const authentication = {
          nodeAuthType: common.node_auth_type,
          configPath: common.nodes[0].config_path,
          bitcoindConfigPath: common.nodes[0].bitcoind_config_path
        };
        jsonConfig.Settings.channelBackupPath = (undefined !== jsonConfig.Settings.channelBackupPath) ? jsonConfig.Settings.channelBackupPath : common.nodes[0].channel_backup_path;
        res.status(200).json({ selectedNodeIndex: common.selectedNode.index, sso: sso, nodes: [{
          index: common.nodes[0].index,
          lnNode: 'SingleNode',
          lnImplementation: '',
          settings: jsonConfig.Settings,
          authentication: authentication}] });
      }
    });
  } else {
    var RTLMultiNodeConfFile = common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
    logger.info({fileName: 'RTLConf', msg: 'Getting Multi Node Config'});
    fs.readFile(RTLMultiNodeConfFile, 'utf8', function(err, data) {
      if (err) {
        if (err.code === 'ENOENT') {
          logger.error({fileName: 'RTLConf', lineNum: 46, msg: 'Multi Node Config does not exist!'});
          res.status(200).json({ selectedNodeIndex: {}, sso: {}, nodes: [] });
        } else {
          logger.error({fileName: 'RTLConf', lineNum: 49, msg: 'Getting Multi Node Config Failed!'});
          res.status(500).json({
            message: "Reading Multi Node Config Failed!",
            error: err
          });
        }
      } else {
        const multiNodeConfig = JSON.parse(data);
        const sso = { rtlSSO: common.rtl_sso, logoutRedirectLink: common.logout_redirect_link };
        var nodesArr = [];
        if (multiNodeConfig.nodes && multiNodeConfig.nodes.length > 0) {
          multiNodeConfig.nodes.forEach((node, i) => {
            const authentication = {};
            authentication.nodeAuthType = 'CUSTOM';
            if(node.Authentication && node.Authentication.lndConfigPath) {
              authentication.configPath = node.Authentication.lndConfigPath;
            } else if(node.Authentication && node.Authentication.configPath) {
              authentication.configPath = node.Authentication.configPath;
            } else {
              authentication.configPath = '';
            }
  
            if(node.Settings.bitcoindConfigPath) {
              authentication.bitcoindConfigPath = node.Settings.bitcoindConfigPath;
            }
            node.Settings.channelBackupPath = (undefined !== node.Settings.channelBackupPath) ? node.Settings.channelBackupPath : common.nodes[i].channel_backup_path;
            nodesArr.push({
              index: node.index,
              lnNode: node.lnNode,
              lnImplementation: node.lnImplementation,
              settings: node.Settings,
              authentication: authentication})
          });
        }
        res.status(200).json({ selectedNodeIndex: common.selectedNode.index, sso: sso, nodes: nodesArr });
      }
    });
  }
};

exports.updateUISettings = (req, res, next) => {
  var RTLConfFile = '';
  if(common.multi_node_setup) {
    RTLConfFile = common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
    var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    config.nodes.find(node => {
      if(node.index == common.selectedNode.index) {
        node.Settings.flgSidenavOpened = req.body.updatedSettings.flgSidenavOpened;
        node.Settings.flgSidenavPinned = req.body.updatedSettings.flgSidenavPinned;
        node.Settings.menu = req.body.updatedSettings.menu;
        node.Settings.menuType = req.body.updatedSettings.menuType;
        node.Settings.theme = req.body.updatedSettings.theme;
        node.Settings.satsToBTC = req.body.updatedSettings.satsToBTC;
      }
    });
    try {
      fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
      logger.info({fileName: 'RTLConf', msg: 'Updating UI Settings Succesful!'});
      res.status(201).json({message: 'UI Settings Updated Successfully'});
    }
    catch (err) {
      logger.error({fileName: 'Conf', lineNum: 102, msg: 'Updating UI Settings Failed!'});
      res.status(500).json({
        message: "Updating UI Settings Failed!",
        error: 'Updating UI Settings Failed!'
      });
    }
  } else {
    RTLConfFile = common.rtl_conf_file_path + '/RTL.conf';
    var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    const settingsTemp = config.Settings;
    settingsTemp.flgSidenavOpened = req.body.updatedSettings.flgSidenavOpened;
    settingsTemp.flgSidenavPinned = req.body.updatedSettings.flgSidenavPinned;
    settingsTemp.menu = req.body.updatedSettings.menu;
    settingsTemp.menuType = req.body.updatedSettings.menuType;
    settingsTemp.theme = req.body.updatedSettings.theme;
    settingsTemp.satsToBTC = req.body.updatedSettings.satsToBTC;
    delete config.Settings;
    fs.writeFileSync(RTLConfFile, ini.stringify(config));
    fs.appendFile(RTLConfFile, ini.stringify(settingsTemp, { section: 'Settings' }), function(err) {
      if (err) {
        logger.error({fileName: 'Conf', lineNum: 122, msg:'Updating UI Settings Failed!'});
        res.status(500).json({
          message: "Updating UI Settings Failed!",
          error: 'Updating UI Settings Failed!'
        });
      } else {
        logger.info({fileName: 'RTLConf', msg: 'Updating UI Settings Succesful!'});
        res.status(201).json({message: 'UI Settings Updated Successfully'});
      }
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
      JSONFormat = (common.multi_node_setup) ? true : false;
      confFile = (common.multi_node_setup) ? common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json' : common.rtl_conf_file_path + '/RTL.conf';
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
      if (undefined !== jsonConfig.Authentication && undefined !== jsonConfig.Authentication.rtlPass) {
        jsonConfig.Authentication.rtlPass = jsonConfig.Authentication.rtlPass.replace(/./g, '*');
      }
      if (undefined !== jsonConfig.Bitcoind && undefined !== jsonConfig.Bitcoind['bitcoind.rpcpass']) {
        jsonConfig.Bitcoind['bitcoind.rpcpass'] = jsonConfig.Bitcoind['bitcoind.rpcpass'].replace(/./g, '*');
      }
      if (undefined !== jsonConfig['bitcoind.rpcpass']) {
        jsonConfig['bitcoind.rpcpass'] = jsonConfig['bitcoind.rpcpass'].replace(/./g, '*');
      }
      if (undefined !== jsonConfig['rpcpassword']) {
        jsonConfig['rpcpassword'] = jsonConfig['rpcpassword'].replace(/./g, '*');
      }
      if (undefined !== jsonConfig.multiPass) {
        jsonConfig.multiPass = jsonConfig.multiPass.replace(/./g, '*');
      }
      const responseJSON = (JSONFormat) ? jsonConfig : ini.stringify(jsonConfig);
      res.status(200).json({format: (JSONFormat) ? 'JSON' : 'INI', data: responseJSON});
    }
  });
};

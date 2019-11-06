var os = require('os');
var fs = require('fs');
var platform = require('os').platform();
var crypto = require('crypto');
var hash = crypto.createHash('sha256');
var clArgs = require('optimist').argv;
var ini = require('ini');
var common = require('./common');
var path = require('path');
var upperCase = require('upper-case');
var logger = require('./controllers/logger');
var connect = {};
var errMsg = '';
var request = require('request');
common.path_separator = (platform === 'win32') ? '\\' : '/';

connect.setDefaultConfig = () => {
  var homeDir = os.userInfo().homedir;
  var macaroonPath = '';
  var configPath = '';
  switch (platform) {
    case 'win32':
      macaroonPath = homeDir + '\\AppData\\Local\\Lnd\\data\\chain\\bitcoin\\mainnet';
      configPath = homeDir + '\\AppData\\Local\\Lnd\\lnd.conf';
      break;
    case 'darwin':
      macaroonPath = homeDir + '/Library/Application Support/Lnd/data/chain/bitcoin/mainnet';
      configPath = homeDir + '/Library/Application Support/Lnd/lnd.conf';
      break;
    case 'linux':
      macaroonPath = homeDir + '/.lnd/data/chain/bitcoin/mainnet';
      configPath = homeDir + '/.lnd/lnd.conf';
      break;
    default:
      macaroonPath = '';
      configPath = '';
      break;
  }  
  return {
    Authentication: {
      macaroonPath: macaroonPath,
      nodeAuthType: 'DEFAULT',
      configPath: configPath,
      rtlPass: ''
    },
    Settings: {
      flgSidenavOpened: true,
      flgSidenavPinned: true,
      menu: 'Vertical',
      menuType: 'Regular',
      theme: 'dark-blue',
      satsToBTC: false,
      channelBackupPath: homeDir + common.path_separator + 'backup' + common.path_separator + 'node-0',
      lnServerUrl: 'https://localhost:8080/v1',
      enableLogging: false,
      port: 3000
    },
    SSO: {
      rtlSSO: 0,
      rtlCookiePath: '',
      logoutRedirectLink: '/login'
    }
  };
}

connect.normalizePort = val => {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

connect.setMacaroonPath = (clArgs, config) => {
  common.nodes[0] = {};
  common.nodes[0].index = 1;
  if(undefined !== clArgs.lndir) {
    common.nodes[0].macaroon_path = clArgs.lndir;
  } else if (undefined !== process.env.MACAROON_PATH) {
    common.nodes[0].macaroon_path = process.env.MACAROON_PATH;
  } else {
    if(undefined !== config.Authentication.macroonPath && config.Authentication.macroonPath !== '') {
      common.nodes[0].macaroon_path = config.Authentication.macroonPath;
    } else if(undefined !== config.Authentication.macaroonPath && config.Authentication.macaroonPath !== '') {
      common.nodes[0].macaroon_path = config.Authentication.macaroonPath;
    }
  }
}

connect.convertCustomToHash = (nodeSetupType) => {
  common.rtl_conf_file_path = (undefined !== process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH.substring(0, process.env.RTL_CONFIG_PATH.length - 9) : path.normalize(__dirname);
  if(nodeSetupType === 'SINGLE') {
    try {
      RTLConfFile = common.rtl_conf_file_path + '/RTL.conf';
      var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      const authTemp = config.Authentication;
      authTemp.rtlPassHashed = hash.update(authTemp.rtlPass).digest('hex');
      delete authTemp.rtlPass;
      delete config.Authentication;
      fs.writeFileSync(RTLConfFile, ini.stringify(config));
      fs.appendFileSync(RTLConfFile, ini.stringify(authTemp, { section: 'Authentication' }));
      console.log('Please note that RTL has encrypted the plaintext password into its corresponding hash.');
      return authTemp.rtlPassHashed;
    } catch (err) {
      errMsg = errMsg + '\nrtlPass hash conversion failed!';
    }
  }
  if(nodeSetupType === 'MULTI') {
    try {
      RTLConfFile = common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
      var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      config.multiPassHashed = hash.update(config.multiPass).digest('hex');
      delete config.multiPass;
      fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
      console.log('Please note that RTL has encrypted the plaintext password into its corresponding hash.');
      return config.multiPassHashed;
    } catch (err) {
      errMsg = errMsg + '\nmultiPass hash conversion failed!';
    }
  }
}

connect.validateSingleNodeConfig = (config) => {
  if(common.nodes[0].macaroon_path === '' || undefined === common.nodes[0].macaroon_path) {
    errMsg = 'Please set macaroon path through environment or RTL.conf!';
  }
  
  if(undefined !== process.env.LND_SERVER_URL) {
    common.nodes[0].ln_server_url = process.env.LND_SERVER_URL;
  } else if(undefined !== process.env.LN_SERVER_URL) {
    common.nodes[0].ln_server_url = process.env.LN_SERVER_URL;
  } else {
    if(
      (config.Authentication.lndServerUrl === '' ||  undefined === config.Authentication.lndServerUrl)
      && (config.Settings.lndServerUrl === '' ||  undefined === config.Settings.lndServerUrl)
      && (config.Settings.lnServerUrl === '' ||  undefined === config.Settings.lnServerUrl)
    ) {
      errMsg = errMsg + '\nPlease set Server URL through environment or RTL.conf!';
    } else {
      if (config.Settings.lndServerUrl !== '' &&  undefined !== config.Settings.lndServerUrl) {
        common.nodes[0].ln_server_url = config.Settings.lndServerUrl;
      } else if (config.Authentication.lndServerUrl !== '' &&  undefined !== config.Authentication.lndServerUrl) {
        common.nodes[0].ln_server_url = config.Authentication.lndServerUrl;
      } else if (config.Settings.lnServerUrl !== '' &&  undefined !== config.Settings.lnServerUrl) {
        common.nodes[0].ln_server_url = config.Settings.lnServerUrl;
      } 
    }
  }

  if(undefined !== process.env.NODE_AUTH_TYPE) {
    common.node_auth_type = process.env.NODE_AUTH_TYPE;
  } else {
    if(config.Authentication.nodeAuthType === '' ||  undefined === config.Authentication.nodeAuthType) {
      errMsg = errMsg + '\nPlease set Node Auth Type through environment or RTL.conf!';
    } else {
      common.node_auth_type = config.Authentication.nodeAuthType;
    }
  }

  if(undefined !== process.env.LND_CONFIG_PATH) {
    common.nodes[0].config_path = process.env.LND_CONFIG_PATH;
  } else if (undefined !== process.env.CONFIG_PATH) {
    common.nodes[0].config_path = process.env.CONFIG_PATH;
  } else {
    if(config.Authentication.lndConfigPath !== '' &&  undefined !== config.Authentication.lndConfigPath) {
      common.nodes[0].config_path = config.Authentication.lndConfigPath;
    } else if(config.Authentication.ConfigPath !== '' &&  undefined !== config.Authentication.ConfigPath) {
      common.nodes[0].config_path = config.Authentication.ConfigPath;
    } else {
      if(upperCase(common.node_auth_type) === 'DEFAULT') {
        errMsg = errMsg + '\nDefault Node Authentication can be set with LND Config Path only. Please set LND Config Path through environment or RTL.conf!';
      }    
    }
  }

  if(undefined !== process.env.BITCOIND_CONFIG_PATH) {
    common.nodes[0].bitcoind_config_path = process.env.BITCOIND_CONFIG_PATH;
  } else {
    if(config.Settings.bitcoindConfigPath !== '' &&  undefined !== config.Settings.bitcoindConfigPath) {
      common.nodes[0].bitcoind_config_path = config.Settings.bitcoindConfigPath;
    } else if(config.Authentication.bitcoindConfigPath !== '' &&  undefined !== config.Authentication.bitcoindConfigPath) {
      common.nodes[0].bitcoind_config_path = config.Authentication.bitcoindConfigPath;
    }
  }

  if(undefined !== process.env.CHANNEL_BACKUP_PATH) {
    common.nodes[0].channel_backup_path = process.env.CHANNEL_BACKUP_PATH;
  } else {
    if(config.Settings.channelBackupPath !== '' &&  undefined !== config.Settings.channelBackupPath) {
      common.nodes[0].channel_backup_path = config.Settings.channelBackupPath;
    } else {
      common.nodes[0].channel_backup_path = common.rtl_conf_file_path + common.path_separator + 'backup';
    }
    try {
      connect.createDirectory(common.nodes[0].channel_backup_path);
      let exists = fs.existsSync(common.nodes[0].channel_backup_path + common.path_separator + 'channel-all.bak');
      if (!exists) {
        try {
          var createStream = fs.createWriteStream(common.nodes[0].channel_backup_path + common.path_separator + 'channel-all.bak');
          createStream.end();
        } catch (err) {
          console.error('Something went wrong while creating backup file: \n' + err);
        }
      }    
    } catch (err) {
      console.error('Something went wrong while creating backup file: \n' + err);
    }
  }

  if(undefined !== process.env.LN_IMPLEMENTATION) {
    common.ln_implementation = process.env.LN_IMPLEMENTATION;
  } else if (config.lnImplementation && config.lnImplementation !== '') {
    common.ln_implementation = config.lnImplementation;
  } else {
    common.ln_implementation = 'LND';
  }

  if(!+config.SSO.rtlSSO) {
    if (undefined !== process.env.RTL_PASS) {
      common.rtl_pass = hash.update(process.env.RTL_PASS).digest('hex');
    } else if (config.Authentication.rtlPassHashed !== '' && undefined !== config.Authentication.rtlPassHashed) {
      common.rtl_pass = config.Authentication.rtlPassHashed;
    } else if (config.Authentication.rtlPass !== '' && undefined !== config.Authentication.rtlPass) {
      common.rtl_pass = connect.convertCustomToHash('SINGLE');
    }
  }
  
	if (upperCase(common.node_auth_type) === 'CUSTOM' && (common.rtl_pass === '' || undefined === common.rtl_pass)) {
		errMsg = errMsg + '\nCustom Node Authentication can be set with RTL password only. Please set RTL Password through environment or RTL.conf';
	}

	if (undefined !== process.env.ENABLE_LOGGING) {
		common.nodes[0].enable_logging = process.env.ENABLE_LOGGING;
	} else if (undefined !== config.Settings.enableLogging) {
		common.nodes[0].enable_logging = config.Settings.enableLogging;
	} else if (undefined !== config.Authentication.enableLogging) {
		common.nodes[0].enable_logging = config.Authentication.enableLogging;
	}
	if (common.nodes[0].enable_logging) {
		common.nodes[0].log_file = common.rtl_conf_file_path + '/logs/RTL.log';
		let exists = fs.existsSync(common.nodes[0].log_file);
		if (exists) {
			fs.writeFile(common.nodes[0].log_file, '', () => { });
    } else {
			try {
				var dirname = path.dirname(common.nodes[0].log_file);
				connect.createDirectory(dirname);
				var createStream = fs.createWriteStream(common.nodes[0].log_file);
				createStream.end();
			}
			catch (err) {
				console.error('Something went wrong while creating log file: \n' + err);
			}
		}
	}

  if (undefined !== process.env.PORT) {
		common.port = connect.normalizePort(process.env.PORT);
	} else if (undefined !== config.Settings.port) {
		common.port = connect.normalizePort(config.Settings.port);
	}

  connect.setSSOParams(config);
	if (errMsg !== '') {
		throw new Error(errMsg);
  }
  
}

connect.validateMultiNodeConfig = (config) => {
  if(!+config.SSO.rtlSSO) {
    common.node_auth_type = 'CUSTOM';
    if (undefined !== process.env.RTL_PASS) {
      common.rtl_pass = hash.update(process.env.RTL_PASS).digest('hex');
    } else if (config.multiPassHashed !== '' && undefined !== config.multiPassHashed) {
      common.rtl_pass = config.multiPassHashed;
    } else if (config.multiPass !== '' && undefined !== config.multiPass) {
      common.rtl_pass = connect.convertCustomToHash('MULTI');
    } else {
      errMsg = errMsg + '\nMulti Node Authentication can be set with multiPass only. Please set MultiPass in RTL-Multi-Node-Conf.json';
    }
  }
  common.port = (undefined !== config.port) ? connect.normalizePort(config.port) : 3000;
  if (config.nodes && config.nodes.length > 0) {
    config.nodes.forEach((node, idx) => {
      common.nodes[idx] = {};
      if(node.Authentication.macaroonPath === '' || undefined === node.Authentication.macaroonPath) {
        errMsg = 'Please set macaroon path for node index ' + node.index + ' in RTL-Multi-Node-Conf.json!';
      } else {
        common.nodes[idx].macaroon_path = node.Authentication.macaroonPath;
      }

      if(
        (node.Settings.lndServerUrl === '' ||  undefined === node.Settings.lndServerUrl)
        && (node.Settings.lnServerUrl === '' ||  undefined === node.Settings.lnServerUrl)
      ) {
        errMsg = errMsg + '\nPlease set server URL for node index ' + node.index + ' in RTL-Multi-Node-Conf.json!';
      } else {
        common.nodes[idx].ln_server_url = node.Settings.lndServerUrl ? node.Settings.lndServerUrl : node.Settings.lnServerUrl;
      }

      common.nodes[idx].index = node.index;
      common.nodes[idx].ln_node = node.lnNode;
      common.nodes[idx].ln_implementation = node.lnImplementation;
      if (undefined !== node.Authentication && undefined !== node.Authentication.lndConfigPath) {
        common.nodes[idx].config_path = node.Authentication.lndConfigPath;
      } else if (undefined !== node.Authentication && undefined !== node.Authentication.configPath) {
        common.nodes[idx].config_path = node.Authentication.configPath;
      } else {
        common.nodes[idx].config_path = '';
      }
      common.nodes[idx].bitcoind_config_path = (undefined !== node.Settings.bitcoindConfigPath) ? node.Settings.bitcoindConfigPath : '';
      common.nodes[idx].enable_logging = (undefined !== node.Settings.enableLogging) ? node.Settings.enableLogging : false;
      common.nodes[idx].channel_backup_path = (undefined !== node.Settings.channelBackupPath) ? node.Settings.channelBackupPath : common.rtl_conf_file_path + common.path_separator + 'backup' + common.path_separator + 'node-' + node.index;
      try {
        connect.createDirectory(common.nodes[idx].channel_backup_path);
        let exists = fs.existsSync(common.nodes[idx].channel_backup_path + common.path_separator + 'channel-all.bak');
        if (!exists) {
          try {
            var createStream = fs.createWriteStream(common.nodes[idx].channel_backup_path + common.path_separator + 'channel-all.bak');
            createStream.end();
          } catch (err) {
            console.error('Something went wrong while creating backup file: \n' + err);
          }
        }    
      } catch (err) {
        console.error('Something went wrong while creating backup file: \n' + err);
      }

      if (common.nodes[idx].enable_logging) {
        common.nodes[idx].log_file = common.rtl_conf_file_path + '/logs/RTL-Node-' + node.index + '.log';
        const log_file = common.nodes[idx].log_file;
        if (fs.existsSync(log_file)) {
          fs.writeFile(log_file, '', () => { });
        } else {
          try {
            var dirname = path.dirname(log_file);
            connect.createDirectory(dirname);
            var createStream = fs.createWriteStream(log_file);
            createStream.end();
          }
          catch (err) {
            console.error('Something went wrong while creating log file ' + log_file + ': \n' + err);
          }
        }
      }
    });
  }

  connect.setSSOParams(config);
	if (errMsg !== '') { throw new Error(errMsg); }
}

connect.setSSOParams = (config) => {
	if (undefined !== process.env.RTL_SSO) {
		common.rtl_sso = process.env.RTL_SSO;
	} else if (undefined !== config.SSO && undefined !== config.SSO.rtlSSO) {
		common.rtl_sso = config.SSO.rtlSSO;
	}

	if (+common.rtl_sso) {
    if (undefined !== process.env.LOGOUT_REDIRECT_LINK) {
      common.logout_redirect_link = process.env.LOGOUT_REDIRECT_LINK;
    } else if (undefined !== config.SSO && undefined !== config.SSO.logoutRedirectLink) {
      common.logout_redirect_link = config.SSO.logoutRedirectLink;
    }
    
    if (undefined !== process.env.RTL_COOKIE_PATH) {
      common.rtl_cookie_path = process.env.RTL_COOKIE_PATH;
    } else if (undefined !== config.SSO && undefined !== config.SSO.rtlCookiePath) {
      common.rtl_cookie_path = config.SSO.rtlCookiePath;
    } else {
      common.rtl_cookie_path = common.rtl_conf_file_path + '/cookies/auth.cookie';
    }
    if (common.rtl_cookie_path === '') {
      errMsg = 'Please set rtlCookiePath value for single sign on option!';
    } else {
      connect.readCookie(common.rtl_cookie_path);
    }
  }
};

connect.createDirectory = (dirname) => {
  try {
    const sep = path.sep;
    const initDir = path.isAbsolute(dirname) ? sep : '';
    dirname.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(parentDir, childDir);
      if (!fs.existsSync(curDir)) {
        fs.mkdirSync(curDir);
      }
      return curDir;
    }, initDir);
  } catch (err) {
    if (err.code === 'EEXIST') {
      return dirname;
    }
    if (err.code === 'ENOENT') {
      throw new Error(`EACCES: permission denied, mkdir '${dirname}'`);
    }
  }
}

connect.readCookie = (cookieFile) => {
  let exists = fs.existsSync(cookieFile);
  if (exists) {
    try {
      common.cookie = fs.readFileSync(cookieFile, 'utf-8');
    } catch (err) {
      console.error('Something went wrong while reading cookie: \n' + err);
      throw new Error(err);
    }
  } else {
    try {
      var dirname = path.dirname(cookieFile);
      connect.createDirectory(dirname);
      fs.writeFileSync(cookieFile, crypto.randomBytes(64).toString('hex'));
      common.cookie = fs.readFileSync(cookieFile, 'utf-8');
    }
    catch(err) {
      console.error('Something went wrong while reading the cookie: \n' + err);
      throw new Error(err);
    }
  }
}

connect.refreshCookie = (cookieFile) => {
  try {
    fs.writeFileSync(cookieFile, crypto.randomBytes(64).toString('hex'));
    common.cookie = fs.readFileSync(cookieFile, 'utf-8');
  }
  catch(err) {
    console.error('Something went wrong while refreshing cookie: \n' + err);
    throw new Error(err);
  }
}

connect.logEnvVariables = () => {
  if (common.multi_node_setup && common.nodes && common.nodes.length > 0) {
    common.nodes.forEach((node, idx) => {
      if (!node.enable_logging) { return; }
      logger.info({fileName: 'Config Setup Variable', msg: 'DEFAULT_NODE_INDEX: ' + common.selectedNode.index});
      logger.info({fileName: 'Config Setup Variable', msg: 'NODE_SETUP: MULTI', node});
      logger.info({fileName: 'Config Setup Variable', msg: 'RTL_SSO: ' + common.rtl_sso, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'RTL_COOKIE_PATH: ' + common.rtl_cookie_path, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LOGOUT_REDIRECT_LINK: ' + common.logout_redirect_link + '\r\n', node});
      logger.info({fileName: 'Config Setup Variable', msg: 'INDEX: ' + node.index, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LN NODE: ' + node.ln_node, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LN IMPLEMENTATION: ' + node.ln_implementation, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'PORT: ' + common.port, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'MACAROON_PATH: ' + node.macaroon_path, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LND_SERVER_URL: ' + node.ln_server_url, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'RTL_CONFIG_PATH: ' + node.rtl_conf_file_path, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'CONFIG_PATH: ' + node.config_path, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'BITCOIND_CONFIG_PATH: ' + node.bitcoind_config_path, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'CHANNEL_BACKUP_PATH: ' + node.channel_backup_path, node});
    });  
  } else {
    if (!common.nodes[0].enable_logging) { return; }
    logger.info({fileName: 'Config Setup Variable', msg: 'NODE_SETUP: SINGLE'});
    logger.info({fileName: 'Config Setup Variable', msg: 'PORT: ' + common.port});
    logger.info({fileName: 'Config Setup Variable', msg: 'LND_SERVER_URL: ' + common.nodes[0].ln_server_url});
    logger.info({fileName: 'Config Setup Variable', msg: 'MACAROON_PATH: ' + common.nodes[0].macaroon_path});
    logger.info({fileName: 'Config Setup Variable', msg: 'NODE_AUTH_TYPE: ' + common.node_auth_type});
    logger.info({fileName: 'Config Setup Variable', msg: 'CONFIG_PATH: ' + common.nodes[0].config_path});
    logger.info({fileName: 'Config Setup Variable', msg: 'RTL_CONFIG_PATH: ' + common.rtl_conf_file_path});
    logger.info({fileName: 'Config Setup Variable', msg: 'BITCOIND_CONFIG_PATH: ' + common.nodes[0].bitcoind_config_path});
    logger.info({fileName: 'Config Setup Variable', msg: 'CHANNEL_BACKUP_PATH: ' + common.nodes[0].channel_backup_path});
    logger.info({fileName: 'Config Setup Variable', msg: 'RTL_SSO: ' + common.rtl_sso});
    logger.info({fileName: 'Config Setup Variable', msg: 'RTL_COOKIE_PATH: ' + common.rtl_cookie_path});
    logger.info({fileName: 'Config Setup Variable', msg: 'LOGOUT_REDIRECT_LINK: ' + common.logout_redirect_link});
  }
}

connect.getAllNodeAllChannelBackup = (node) => {
  let channel_backup_file = node.channel_backup_path + common.path_separator + 'channel-all.bak';
  let options = { 
    url: node.ln_server_url + '/channels/backup',
    rejectUnauthorized: false,
    json: true,
    headers: {'Grpc-Metadata-macaroon': fs.readFileSync(node.macaroon_path + '/admin.macaroon').toString('hex')}
  };
  request(options, function (err, res, body) {
    if (err) {
      logger.error({fileName: 'Connect', lineNum: 443, msg: 'Channel Backup Response Failed: ' + JSON.stringify(err)});
    } else {
      fs.writeFile(channel_backup_file, JSON.stringify(body), function(err) {
        if (err) {
          if (node.ln_node) {
            logger.error({fileName: 'Connect', lineNum: 448, msg: 'Channel Backup Failed for Node ' + node.ln_node + ' with error response: ' + JSON.stringify(err)});
          } else {
            logger.error({fileName: 'Connect', lineNum: 450, msg: 'Channel Backup Failed: ' + JSON.stringify(err)});
          }
        } else {
          if (node.ln_node) {
            logger.info({fileName: 'Connect', msg: 'Channel Backup Successful for Node: ' + node.ln_node});
          } else {
            logger.info({fileName: 'Connect', msg: 'Channel Backup Successful'});
          }
        }
      });
    }
  })
};

connect.setSingleNodeConfiguration = (singleNodeFilePath) => {
  const exists = fs.existsSync(singleNodeFilePath);
  if (exists) {
    var config = ini.parse(fs.readFileSync(singleNodeFilePath, 'utf-8'));
    connect.setMacaroonPath(clArgs, config);
    connect.validateSingleNodeConfig(config);
    connect.setSelectedNode(config);
    connect.logEnvVariables();
  } else {
    try {
      fs.writeFileSync(singleNodeFilePath, ini.stringify(connect.setDefaultConfig()));
      var config = ini.parse(fs.readFileSync(singleNodeFilePath, 'utf-8'));
      connect.setMacaroonPath(clArgs, config);
      connect.validateSingleNodeConfig(config);
      connect.setSelectedNode(config);
      connect.logEnvVariables();      
    }
    catch(err) {
      console.error('Something went wrong while configuring the single node server: \n' + err);
      throw new Error(err);
    }
  }
}

connect.setMultiNodeConfiguration = (multiNodeFilePath) => {
  try {
    var config = JSON.parse(fs.readFileSync(multiNodeFilePath, 'utf-8'));
    connect.validateMultiNodeConfig(config);
    connect.setSelectedNode(config);
    connect.logEnvVariables();
  }
  catch(err) {
    console.error('Something went wrong while configuring the multi node server: \n' + err);
    throw new Error(err);
  }
}

connect.setSelectedNode = (config) => {
  if(undefined !== process.env.DEFAULT_NODE_INDEX) {
    common.selectedNode = common.findNode(process.env.DEFAULT_NODE_INDEX);
  } else {
    if(undefined !== config.defaultNodeIndex) {
      common.selectedNode = common.findNode(config.defaultNodeIndex);
    } else {
      common.selectedNode = common.findNode(common.nodes[0].index);
    }
  }    
}

connect.setServerConfiguration = () => {
  common.rtl_conf_file_path = (undefined !== process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH.substring(0, process.env.RTL_CONFIG_PATH.length - 9) : path.normalize(__dirname);
  singleNodeConfFile = common.rtl_conf_file_path + '/RTL.conf';
  multiNodeConfFile = common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
  const singleNodeExists = fs.existsSync(singleNodeConfFile);
  const multiNodeExists = fs.existsSync(multiNodeConfFile);
  if ((!multiNodeExists && singleNodeExists) || (!multiNodeExists && !singleNodeExists)) {
    common.multi_node_setup = false;
    connect.setSingleNodeConfiguration(singleNodeConfFile);
  } else if ((multiNodeExists && singleNodeExists) || (multiNodeExists && !singleNodeExists)) {
    common.multi_node_setup = true;
    connect.setMultiNodeConfiguration(multiNodeConfFile);
  }
}

module.exports = connect;

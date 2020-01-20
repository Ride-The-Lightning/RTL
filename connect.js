var os = require('os');
var fs = require('fs');
var platform = require('os').platform();
var crypto = require('crypto');
var hash = crypto.createHash('sha256');
var common = require('./common');
var path = require('path');
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
      channelBackupPath = homeDir + '\\backup\\node-1';
      break;
    case 'darwin':
      macaroonPath = homeDir + '/Library/Application Support/Lnd/data/chain/bitcoin/mainnet';
      configPath = homeDir + '/Library/Application Support/Lnd/lnd.conf';
      channelBackupPath = homeDir + '/backup/node-1';
      break;
    case 'linux':
      macaroonPath = homeDir + '/.lnd/data/chain/bitcoin/mainnet';
      configPath = homeDir + '/.lnd/lnd.conf';
      channelBackupPath = homeDir + '/backup/node-1';
      break;
    default:
      macaroonPath = '';
      configPath = '';
      channelBackupPath = '';
      break;
  }  
  return {
    multiPass: "password",
    port: "3000",
    defaultNodeIndex: 1,
    SSO: {
      rtlSSO: 0,
      rtlCookiePath: "",
      logoutRedirectLink: ""
    },
    nodes: [
      {
        index: 1,
        lnNode: "LND Node 1",
        lnImplementation: "LND",    
        Authentication: {
          macaroonPath: macaroonPath,
          configPath: configPath,
        },
        Settings: {
          userPersona: 'MERCHANT',
          themeMode: "DAY",
          themeColor: "PURPLE",
          channelBackupPath: channelBackupPath,
          enableLogging: false,
          lnServerUrl: "https://localhost:8080/v1",
          fiatConversion: false
        }
      }
    ]
  }
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
  if(clArgs.lndir) {
    common.nodes[0].macaroon_path = clArgs.lndir;
  } else if (process.env.MACAROON_PATH) {
    common.nodes[0].macaroon_path = process.env.MACAROON_PATH;
  } else {
    if(config.Authentication.macroonPath && config.Authentication.macroonPath !== '') {
      common.nodes[0].macaroon_path = config.Authentication.macroonPath;
    } else if(config.Authentication.macaroonPath && config.Authentication.macaroonPath !== '') {
      common.nodes[0].macaroon_path = config.Authentication.macaroonPath;
    }
  }
}

connect.convertCustomToHash = () => {
  common.rtl_conf_file_path = process.env.RTL_CONFIG_PATH ? process.env.RTL_CONFIG_PATH : path.normalize(__dirname);
  try {
    RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
    var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    config.multiPassHashed = hash.update(config.multiPass).digest('hex');
    delete config.multiPass;
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    console.log('Please note that, RTL has encrypted the plaintext password into its corresponding hash.');
    return config.multiPassHashed;
  } catch (err) {
    errMsg = errMsg + '\nPassword hashing failed!';
  }
}

connect.validateNodeConfig = (config) => {
  if(!+config.SSO.rtlSSO) {
    if (process.env.RTL_PASS) {
      common.rtl_pass = hash.update(process.env.RTL_PASS).digest('hex');
    } else if (config.multiPassHashed !== '' && config.multiPassHashed) {
      common.rtl_pass = config.multiPassHashed;
    } else if (config.multiPass !== '' && config.multiPass) {
      common.rtl_pass = connect.convertCustomToHash();
    } else {
      errMsg = errMsg + '\nNode Authentication can be set with multiPass only. Please set multiPass in RTL-Config.json';
    }
  }
  common.port = (config.port) ? connect.normalizePort(config.port) : 3000;
  if (config.nodes && config.nodes.length > 0) {
    config.nodes.forEach((node, idx) => {
      common.nodes[idx] = {};
      if(node.Authentication.macaroonPath === '' || undefined === node.Authentication.macaroonPath) {
        errMsg = 'Please set macaroon path for node index ' + node.index + ' in RTL-Config.json!';
      } else {
        common.nodes[idx].macaroon_path = node.Authentication.macaroonPath;
      }

      if(
        (node.Settings.lndServerUrl === '' ||  undefined === node.Settings.lndServerUrl)
        && (node.Settings.lnServerUrl === '' ||  undefined === node.Settings.lnServerUrl)
      ) {
        errMsg = errMsg + '\nPlease set server URL for node index ' + node.index + ' in RTL-Config.json!';
      } else {
        common.nodes[idx].ln_server_url = node.Settings.lndServerUrl ? node.Settings.lndServerUrl : node.Settings.lnServerUrl;
      }

      common.nodes[idx].index = node.index;
      common.nodes[idx].ln_node = node.lnNode;
      common.nodes[idx].ln_implementation = node.lnImplementation;
      common.nodes[idx].fiat_conversion = node.Settings.fiatConversion ? node.Settings.fiatConversion : false;
      if(common.nodes[idx].fiat_conversion) {
        common.nodes[idx].currency_unit = node.Settings.currencyUnit ? node.Settings.currencyUnit : 'USD';
      }

      if (node.Authentication && node.Authentication.lndConfigPath) {
        common.nodes[idx].config_path = node.Authentication.lndConfigPath;
      } else if (node.Authentication && node.Authentication.configPath) {
        common.nodes[idx].config_path = node.Authentication.configPath;
      } else {
        common.nodes[idx].config_path = '';
      }
      common.nodes[idx].bitcoind_config_path = (node.Settings.bitcoindConfigPath) ? node.Settings.bitcoindConfigPath : '';
      common.nodes[idx].enable_logging = (node.Settings.enableLogging) ? node.Settings.enableLogging : false;
      common.nodes[idx].channel_backup_path = (node.Settings.channelBackupPath) ? node.Settings.channelBackupPath : common.rtl_conf_file_path + common.path_separator + 'backup' + common.path_separator + 'node-' + node.index;
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
	if (process.env.RTL_SSO) {
		common.rtl_sso = process.env.RTL_SSO;
	} else if (config.SSO && config.SSO.rtlSSO) {
		common.rtl_sso = config.SSO.rtlSSO;
	}

	if (+common.rtl_sso) {
    if (process.env.LOGOUT_REDIRECT_LINK) {
      common.logout_redirect_link = process.env.LOGOUT_REDIRECT_LINK;
    } else if (config.SSO && config.SSO.logoutRedirectLink) {
      common.logout_redirect_link = config.SSO.logoutRedirectLink;
    }
    
    if (process.env.RTL_COOKIE_PATH) {
      common.rtl_cookie_path = process.env.RTL_COOKIE_PATH;
    } else if (config.SSO && config.SSO.rtlCookiePath) {
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
  if (common.nodes && common.nodes.length > 0) {
    common.nodes.forEach((node, idx) => {
      if (!node.enable_logging) { return; }
      logger.info({fileName: 'Config Setup Variable', msg: 'PORT: ' + common.port, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'DEFAULT NODE INDEX: ' + common.selectedNode.index});
      logger.info({fileName: 'Config Setup Variable', msg: 'SSO: ' + common.rtl_sso, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LOGOUT REDIRECT LINK: ' + common.logout_redirect_link + '\r\n', node});
      logger.info({fileName: 'Config Setup Variable', msg: 'INDEX: ' + node.index, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LN NODE: ' + node.ln_node, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LN IMPLEMENTATION: ' + node.ln_implementation, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'FIAT CONVERSION: ' + node.fiatConversion, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'CURRENCY UNIT: ' + node.currency_unit, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LN SERVER URL: ' + node.ln_server_url, node});
    });  
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

connect.setSelectedNode = (config) => {
  if(config.defaultNodeIndex) {
    common.selectedNode = common.findNode(config.defaultNodeIndex);
  } else {
    common.selectedNode = common.findNode(common.nodes[0].index);
  }
}

connect.setServerConfiguration = () => {
  try {
    common.rtl_conf_file_path = (process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH : path.normalize(__dirname);
    confFileFullPath = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
    if (!fs.existsSync(confFileFullPath)) {
      fs.writeFileSync(confFileFullPath, JSON.stringify(connect.setDefaultConfig()));
    }
    var config = JSON.parse(fs.readFileSync(confFileFullPath, 'utf-8'));
    connect.validateNodeConfig(config);
    connect.setSelectedNode(config);
    connect.logEnvVariables();
  } catch(err) {
    console.error('Something went wrong while configuring the node server: \n' + err);
    throw new Error(err);
  }
}

module.exports = connect;

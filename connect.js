var os = require('os');
var fs = require('fs');
var platform = require('os').platform();
var crypto = require('crypto');
var hash = crypto.createHash('sha256');
var common = require('./common');
var path = require('path');
var logger = require('./controllers/shared/logger');
var connect = {};
var errMsg = '';
var request = require('request');
var ini = require('ini');
var parseHocon = require('hocon-parser');
common.path_separator = (platform === 'win32') ? '\\' : '/';

connect.setDefaultConfig = () => {
  var homeDir = os.userInfo().homedir;
  var macaroonPath = '';
  var configPath = '';
  var channelBackupPath = '';
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
        lnNode: "Node 1",
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
          lnServerUrl: "https://localhost:8080",
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

connect.replacePasswordWithHash = (multiPassHashed) => {
  common.rtl_conf_file_path = process.env.RTL_CONFIG_PATH ? process.env.RTL_CONFIG_PATH : path.normalize(__dirname);
  try {
    RTLConfFile = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
    var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    config.multiPassHashed = multiPassHashed;
    delete config.multiPass;
    fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
    console.log('Please note that, RTL has encrypted the plaintext password into its corresponding hash.');
    return config.multiPassHashed;
  } catch (err) {
    errMsg = errMsg + '\nPassword hashing failed!';
  }
}

connect.validateNodeConfig = (config) => {
  if((process.env.RTL_SSO == 0) || (typeof process.env.RTL_SSO === 'undefined' && +config.SSO.rtlSSO === 0)) {
    if (config.multiPassHashed !== '' && config.multiPassHashed) {
      common.rtl_pass = config.multiPassHashed;
    } else if (config.multiPass !== '' && config.multiPass) {
      common.rtl_pass = connect.replacePasswordWithHash(hash.update(config.multiPass).digest('hex'));
    } else {
      errMsg = errMsg + '\nNode Authentication can be set with multiPass only. Please set multiPass in RTL-Config.json';
    }
    common.rtl_secret2fa = config.secret2fa;
  }
  common.port = (process.env.PORT) ? connect.normalizePort(process.env.PORT) : (config.port) ? connect.normalizePort(config.port) : 3000;
  common.host = (process.env.HOST) ? process.env.HOST : (config.host) ? config.host : null;
  if (config.nodes && config.nodes.length > 0) {
    config.nodes.forEach((node, idx) => {
      common.nodes[idx] = {};
      common.nodes[idx].index = node.index;
      common.nodes[idx].ln_node = node.lnNode;
      common.nodes[idx].ln_implementation = (process.env.LN_IMPLEMENTATION) ? process.env.LN_IMPLEMENTATION : node.lnImplementation ? node.lnImplementation : 'LND';
      if (common.nodes[idx].ln_implementation !== 'ECL' && process.env.MACAROON_PATH && process.env.MACAROON_PATH.trim() !== '') {
        common.nodes[idx].macaroon_path = process.env.MACAROON_PATH;
      } else if(common.nodes[idx].ln_implementation !== 'ECL' && node.Authentication && node.Authentication.macaroonPath && node.Authentication.macaroonPath.trim() !== '') {
        common.nodes[idx].macaroon_path = node.Authentication.macaroonPath;
      } else if (common.nodes[idx].ln_implementation !== 'ECL') {
        errMsg = 'Please set macaroon path for node index ' + node.index + ' in RTL-Config.json!';
      }

      if (common.nodes[idx].ln_implementation === 'ECL') {
        if (process.env.LN_API_PASSWORD) {
          common.nodes[idx].ln_api_password = process.env.LN_API_PASSWORD;
        } else if (node.Authentication && node.Authentication.lnApiPassword) {
          common.nodes[idx].ln_api_password = node.Authentication.lnApiPassword;
        } else {
          common.nodes[idx].ln_api_password = '';
        }
      }
      if (process.env.CONFIG_PATH) {
        common.nodes[idx].config_path = process.env.CONFIG_PATH;
      } else if (process.env.LND_CONFIG_PATH) {
        common.nodes[idx].config_path = process.env.LND_CONFIG_PATH;
      } else if (node.Authentication && node.Authentication.lndConfigPath) {
        common.nodes[idx].config_path = node.Authentication.lndConfigPath;
      } else if (node.Authentication && node.Authentication.configPath) {
        common.nodes[idx].config_path = node.Authentication.configPath;
      } else {
        common.nodes[idx].config_path = '';
      }
      if (common.nodes[idx].ln_implementation === 'ECL' && common.nodes[idx].ln_api_password === '' && common.nodes[idx].config_path !== '') {
        try {
          let exists = fs.existsSync(common.nodes[idx].config_path);
          if (exists) {
            try {
              let configFile = fs.readFileSync(common.nodes[idx].config_path, 'utf-8');
              let iniParsed = ini.parse(configFile);
              common.nodes[idx].ln_api_password = iniParsed['eclair.api.password'] ? iniParsed['eclair.api.password'] : parseHocon(configFile).eclair.api.password;
            } catch (err) {
              errMsg = errMsg + '\nSomething went wrong while reading config file: \n' + err;
            }
          } else {
            errMsg = errMsg + '\nInvalid config path: ' + common.nodes[idx].config_path;
          }   
        } catch (err) {
          errMsg = errMsg + '\nUnable to read config file: \n' + err;
        }
      }
      if (common.nodes[idx].ln_implementation === 'ECL' && common.nodes[idx].ln_api_password === '') {
        errMsg = errMsg + '\nPlease set config path Or api password for node index ' + node.index + ' in RTL-Config.json! It is mandatory for Eclair authentication!';
      }

      if(process.env.LN_SERVER_URL && process.env.LN_SERVER_URL.trim() !== '') {
        common.nodes[idx].ln_server_url = process.env.LN_SERVER_URL.endsWith('/v1') ? process.env.LN_SERVER_URL.slice(0, -3) : process.env.LN_SERVER_URL;
      } else if(process.env.LND_SERVER_URL && process.env.LND_SERVER_URL.trim() !== '') {
        common.nodes[idx].ln_server_url = process.env.LND_SERVER_URL.endsWith('/v1') ? process.env.LND_SERVER_URL.slice(0, -3) : process.env.LND_SERVER_URL;
      } else if(node.Settings.lnServerUrl && node.Settings.lnServerUrl.trim() !== '') {
        common.nodes[idx].ln_server_url = node.Settings.lnServerUrl.endsWith('/v1') ? node.Settings.lnServerUrl.slice(0, -3) : node.Settings.lnServerUrl;
     } else if(node.Settings.lndServerUrl && node.Settings.lndServerUrl.trim() !== '') {
        common.nodes[idx].ln_server_url = node.Settings.lndServerUrl.endsWith('/v1') ? node.Settings.lndServerUrl.slice(0, -3) : node.Settings.lndServerUrl;
      } else {
        errMsg = errMsg + '\nPlease set LN Server URL for node index ' + node.index + ' in RTL-Config.json!';
      }
      common.nodes[idx].user_persona = node.Settings.userPersona ? node.Settings.userPersona : 'MERCHANT';
      common.nodes[idx].theme_mode = node.Settings.themeMode ? node.Settings.themeMode : 'DAY';
      common.nodes[idx].theme_color = node.Settings.themeColor ? node.Settings.themeColor : 'PURPLE';
      common.nodes[idx].fiat_conversion = node.Settings.fiatConversion ? !!node.Settings.fiatConversion : false;
      if(common.nodes[idx].fiat_conversion) {
        common.nodes[idx].currency_unit = node.Settings.currencyUnit ? node.Settings.currencyUnit : 'USD';
      }
      if(process.env.SWAP_SERVER_URL && process.env.SWAP_SERVER_URL.trim() !== '') {
        common.nodes[idx].swap_server_url = process.env.SWAP_SERVER_URL.endsWith('/v1') ? process.env.SWAP_SERVER_URL.slice(0, -3) : process.env.SWAP_SERVER_URL;
        common.nodes[idx].swap_macaroon_path = process.env.SWAP_MACAROON_PATH;
      } else if(node.Settings.swapServerUrl && node.Settings.swapServerUrl.trim() !== '') {
        common.nodes[idx].swap_server_url = node.Settings.swapServerUrl.endsWith('/v1') ? node.Settings.swapServerUrl.slice(0, -3) : node.Settings.swapServerUrl;
        common.nodes[idx].swap_macaroon_path = node.Authentication.swapMacaroonPath ? node.Authentication.swapMacaroonPath : '';
      } else {
        common.nodes[idx].swap_server_url = '';
        common.nodes[idx].swap_macaroon_path = '';
      }
      if(process.env.BOLTZ_SERVER_URL && process.env.BOLTZ_SERVER_URL.trim() !== '') {
        common.nodes[idx].boltz_server_url = process.env.BOLTZ_SERVER_URL.endsWith('/v1') ? process.env.BOLTZ_SERVER_URL.slice(0, -3) : process.env.BOLTZ_SERVER_URL;
        common.nodes[idx].boltz_macaroon_path = process.env.BOLTZ_MACAROON_PATH;
      } else if(node.Settings.boltzServerUrl && node.Settings.boltzServerUrl.trim() !== '') {
        common.nodes[idx].boltz_server_url = node.Settings.boltzServerUrl.endsWith('/v1') ? node.Settings.boltzServerUrl.slice(0, -3) : node.Settings.boltzServerUrl;
        common.nodes[idx].boltz_macaroon_path = node.Authentication.boltzMacaroonPath ? node.Authentication.boltzMacaroonPath : '';
      } else {
        common.nodes[idx].boltz_server_url = '';
        common.nodes[idx].boltz_macaroon_path = '';
      }
      common.nodes[idx].bitcoind_config_path = process.env.BITCOIND_CONFIG_PATH ? process.env.BITCOIND_CONFIG_PATH : (node.Settings.bitcoindConfigPath) ? node.Settings.bitcoindConfigPath : '';
      common.nodes[idx].enable_logging = (node.Settings.enableLogging) ? !!node.Settings.enableLogging : false;
      common.nodes[idx].channel_backup_path = process.env.CHANNEL_BACKUP_PATH ? process.env.CHANNEL_BACKUP_PATH : (node.Settings.channelBackupPath) ? node.Settings.channelBackupPath : common.rtl_conf_file_path + common.path_separator + 'backup' + common.path_separator + 'node-' + node.index;
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
        console.error('Something went wrong while creating the backup directory: \n' + err);
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
	if (errMsg && errMsg.trim() !== '') { throw new Error(errMsg); }
}

connect.setSSOParams = (config) => {
	if (process.env.RTL_SSO) {
		common.rtl_sso = process.env.RTL_SSO;
	} else if (config.SSO && config.SSO.rtlSSO) {
		common.rtl_sso = config.SSO.rtlSSO;
	}
 
  if (process.env.RTL_COOKIE_PATH) {
    common.rtl_cookie_path = process.env.RTL_COOKIE_PATH;
  } else if (config.SSO && config.SSO.rtlCookiePath) {
    common.rtl_cookie_path = config.SSO.rtlCookiePath;
  } else {
    common.rtl_cookie_path = '';
  }

  if (process.env.LOGOUT_REDIRECT_LINK) {
    common.logout_redirect_link = process.env.LOGOUT_REDIRECT_LINK;
  } else if (config.SSO && config.SSO.logoutRedirectLink) {
    common.logout_redirect_link = config.SSO.logoutRedirectLink;
  }

  if (+common.rtl_sso) {
    if (!common.rtl_cookie_path || common.rtl_cookie_path.trim() === '') {
      errMsg = 'Please set rtlCookiePath value for single sign on option!';
    } else {
      connect.readCookie(common.rtl_cookie_path);
    }
  }
};

connect.createDirectory = (dirname) => {
  const initDir = path.isAbsolute(dirname) ? path.sep : '';
  dirname.split(path.sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(parentDir, childDir);
    try {
      if (!fs.existsSync(curDir)) {
        fs.mkdirSync(curDir);
      }
    } catch (err) {
      if (err.code !== 'EEXIST') {
        if (err.code === 'ENOENT') {
          throw new Error(`ENOENT: No such file or directory, mkdir '${dirname}'. Ensure that channel backup path separator is '${(platform === 'win32') ? '\\\\' : '/'}'`);
        } else {
          throw err;
        }
      }
    }
    return curDir;
  }, initDir);
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
      logger.info({fileName: 'Config Setup Variable', msg: 'HOST: ' + common.host, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'DEFAULT NODE INDEX: ' + common.selectedNode.index});
      logger.info({fileName: 'Config Setup Variable', msg: 'SSO: ' + common.rtl_sso, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LOGOUT REDIRECT LINK: ' + common.logout_redirect_link + '\r\n', node});
      logger.info({fileName: 'Config Setup Variable', msg: 'INDEX: ' + node.index, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LN NODE: ' + node.ln_node, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'LN IMPLEMENTATION: ' + node.ln_implementation, node});
      logger.info({fileName: 'Config Setup Variable', msg: 'FIAT CONVERSION: ' + node.fiat_conversion, node});
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

connect.modifyJsonMultiNodeConfig = (confFileFullPath) => {
  RTLConfFile = common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
  var config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  if (!config.SSO) { config.SSO = {}; }
  var newConfig = {
    port: config.port ? config.port : 3000,
    defaultNodeIndex: config.defaultNodeIndex ? config.defaultNodeIndex : 1,
    SSO: {
      rtlSSO: config.SSO.rtlSSO ? config.SSO.rtlSSO : 0,
      rtlCookiePath: config.SSO.rtlCookiePath ? config.SSO.rtlCookiePath : "",
      logoutRedirectLink: config.SSO.logoutRedirectLink ? config.SSO.logoutRedirectLink : ""
    },
    nodes: []
  };
  if (config.host) {
    newConfig.host = config.host;
  }
  if(config.nodes && config.nodes.length > 0) {
    let newNode = {};
    config.nodes.forEach((node, idx) => {
      newNode = {
        index: node.index ? node.index : (idx + 1),
        lnNode: node.lnNode ? node.lnNode : "Node " + (idx + 1),
        lnImplementation: node.lnImplementation ? node.lnImplementation : "LND",    
        Authentication: {
          macaroonPath: node.Authentication.macaroonPath ? node.Authentication.macaroonPath : ''
        },
        Settings: {
          userPersona: node.Settings.userPersona ? node.Settings.userPersona : "MERCHANT",
          enableLogging: node.Settings.enableLogging ? !!node.Settings.enableLogging : false,
          fiatConversion: node.Settings.fiatConversion ? node.Settings.fiatConversion : false
        }
      };

      if (node.Authentication.configPath) {
        newNode.Authentication.configPath = node.Authentication.configPath;
      } else if (node.Authentication.lndConfigPath) {
        newNode.Authentication.configPath = node.Authentication.lndConfigPath;
      }

      if (node.Settings.theme) {
        var themeArr = node.Settings.theme.split("-");
        if (themeArr[2]) { themeArr[1] = themeArr[1] + themeArr[2]; } // For light-blue-gray
        newNode.Settings.themeMode = (themeArr[0] === "dark") ? "NIGHT" : "DAY";
        newNode.Settings.themeColor = (themeArr[1] === "blue") ? "INDIGO" : (themeArr[1] === "pink") ? "PINK" : (themeArr[1] === "green" || themeArr[1] === "teal") ? "TEAL" : "PURPLE";
      } else {
        newNode.Settings.themeMode = node.Settings.themeMode ? node.Settings.themeMode : "DAY";
        newNode.Settings.themeColor = node.Settings.themeColor ? node.Settings.themeColor : "PURPLE";
      }
      if (node.Settings.currencyUnit) {
        newNode.Settings.currencyUnit = node.Settings.currencyUnit;
      }
      if (node.Settings.bitcoindConfigPath) {
        newNode.Settings.bitcoindConfigPath = node.Settings.bitcoindConfigPath;
      }
      if (node.Settings.channelBackupPath) {
        newNode.Settings.channelBackupPath = node.Settings.channelBackupPath;
      }
      if (node.Settings.lnServerUrl) {
        newNode.Settings.lnServerUrl = node.Settings.lnServerUrl.endsWith('/v1') ? node.Settings.lnServerUrl.slice(0, -3) : node.Settings.lnServerUrl;
      } else if (node.Settings.lndServerUrl) {
        newNode.Settings.lnServerUrl = node.Settings.lndServerUrl.endsWith('/v1') ? node.Settings.lndServerUrl.slice(0, -3) : node.Settings.lndServerUrl;
      }
      newConfig.nodes.push(newNode);
    });
  }
  newConfig.multiPassHashed = config.multiPassHashed ? config.multiPassHashed : config.multiPass ? hash.update(config.multiPass).digest('hex') : '';
  fs.writeFileSync(confFileFullPath, JSON.stringify(newConfig, null, 2), 'utf-8');
}

connect.modifyIniSingleNodeConfig = (confFileFullPath) => {
  RTLConfFile = common.rtl_conf_file_path + '/RTL.conf';
  var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
  if (!config.SSO) { config.SSO = {}; }
  if (!config.Authentication) { config.Authentication = {}; }
  if (!config.Settings) { config.Settings = {}; }
  var newConfig = {
    port: config.Settings.port ? config.Settings.port : 3000,
    defaultNodeIndex: 1,
    SSO: {
      rtlSSO: config.SSO.rtlSSO ? config.SSO.rtlSSO : 0,
      rtlCookiePath: config.SSO.rtlCookiePath ? config.SSO.rtlCookiePath : "",
      logoutRedirectLink: config.SSO.logoutRedirectLink ? config.SSO.logoutRedirectLink : ""
    },
    nodes: [
      {
        index: 1,
        lnNode: "Node 1",
        lnImplementation: config.Settings.lnImplementation ? config.Settings.lnImplementation : "LND",    
        Authentication: {
          macaroonPath: config.Authentication.macaroonPath ? config.Authentication.macaroonPath : (config.Authentication.macroonPath ? config.Authentication.macroonPath : ''),
          configPath: config.Authentication.configPath ? config.Authentication.configPath : (config.Authentication.lndConfigPath ? config.Authentication.lndConfigPath : ''),
        },
        Settings: {
          userPersona: config.Settings.userPersona ? config.Settings.userPersona : "MERCHANT",
          enableLogging: config.Settings.enableLogging ? !!config.Settings.enableLogging : (config.Authentication.enableLogging ? !!config.Authentication.enableLogging : false),
          fiatConversion: config.Settings.fiatConversion ? config.Settings.fiatConversion : false
        }
      }
    ]
  };
  if (config.Settings.theme) {
    var themeArr = config.Settings.theme.split("-");
    if (themeArr[2]) { themeArr[1] = themeArr[1] + themeArr[2]; } // For light-blue-gray
    newConfig.nodes[0].Settings.themeMode = (themeArr[0] === "dark") ? "NIGHT" : "DAY";
    newConfig.nodes[0].Settings.themeColor = (themeArr[1] === "blue") ? "INDIGO" : (themeArr[1] === "pink") ? "PINK" : (themeArr[1] === "green" || themeArr[1] === "teal") ? "TEAL" : "PURPLE";
  } else {
    newConfig.nodes[0].Settings.themeMode = config.Settings.themeMode ? config.Settings.themeMode : "DAY";
    newConfig.nodes[0].Settings.themeColor = config.Settings.themeColor ? config.Settings.themeColor : "PURPLE";
  }
  if (config.Settings.currencyUnit) {
    newConfig.nodes[0].Settings.currencyUnit = config.Settings.currencyUnit;
  }

  if (config.Settings.bitcoindConfigPath) {
    newConfig.nodes[0].Settings.bitcoindConfigPath = config.Settings.bitcoindConfigPath;
  } else if(config.Authentication.bitcoindConfigPath) {
    newConfig.nodes[0].Settings.bitcoindConfigPath = config.Authentication.bitcoindConfigPath;
  }

  if (config.Settings.channelBackupPath) {
    newConfig.nodes[0].Settings.channelBackupPath = config.Settings.channelBackupPath;
  }
  if (config.Settings.lnServerUrl) {
    newConfig.nodes[0].Settings.lnServerUrl = config.Settings.lnServerUrl.endsWith('/v1') ? config.Settings.lnServerUrl.slice(0, -3) : config.Settings.lnServerUrl;
  } else if (config.Settings.lndServerUrl) {
    newConfig.nodes[0].Settings.lnServerUrl = config.Settings.lndServerUrl.endsWith('/v1') ? config.Settings.lndServerUrl.slice(0, -3) : config.Settings.lndServerUrl;
  } else if (config.Authentication.lndServerUrl) {
    newConfig.nodes[0].Settings.lnServerUrl = config.Authentication.lndServerUrl.endsWith('/v1') ? config.Authentication.lndServerUrl.slice(0, -3) : config.Authentication.lndServerUrl;
  }
  newConfig.multiPassHashed = config.Authentication.rtlPassHashed ? config.Authentication.rtlPassHashed : config.Authentication.rtlPass ? hash.update(config.Authentication.rtlPass).digest('hex') : '';
  fs.writeFileSync(confFileFullPath, JSON.stringify(newConfig, null, 2), 'utf-8');
}

connect.upgradeConfig = (confFileFullPath) => {
  try {
    singleNodeConfFile = common.rtl_conf_file_path + '/RTL.conf';
    multiNodeConfFile = common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
    const singleNodeExists = fs.existsSync(singleNodeConfFile);
    const multiNodeExists = fs.existsSync(multiNodeConfFile);
    if ((singleNodeExists && multiNodeExists) || (!singleNodeExists && multiNodeExists)) {
      console.log('Start...config migration for file ' + multiNodeConfFile);
      connect.modifyJsonMultiNodeConfig(confFileFullPath);
      console.log('End...config migration.');
    } else if (singleNodeExists && !multiNodeExists) {
      console.log('Start...config migration for file ' + singleNodeConfFile);
      connect.modifyIniSingleNodeConfig(confFileFullPath);
      console.log('End...config migration.');
    } else if (!singleNodeExists && !multiNodeExists) {
      if (!fs.existsSync(confFileFullPath)) {
        console.log('Start...config creation at: ' + confFileFullPath);
        fs.writeFileSync(confFileFullPath, JSON.stringify(connect.setDefaultConfig(), null, 2), 'utf-8');
        console.log('End...config creation.');
      }
    }
  } catch(err) {
    console.error('Something went wrong while upgrading the RTL config file: \n' + err);
    throw new Error(err);
  }
}

connect.setServerConfiguration = () => {
  try {
    common.rtl_conf_file_path = (process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH : path.normalize(__dirname);
    confFileFullPath = common.rtl_conf_file_path +  common.path_separator + 'RTL-Config.json';
    if(!fs.existsSync(confFileFullPath)) {
      connect.upgradeConfig(confFileFullPath);
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

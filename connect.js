var os = require('os');
var fs = require('fs');
var platform = require('os').platform();
var crypto = require('crypto');
var clArgs = require('optimist').argv;
var ini = require('ini');
var common = require('./common');
var path = require('path');
var upperCase = require('upper-case');
var logger = require('./controllers/logger');
var connect = {};

const setDefaultConfig = () => {
  var homeDir = os.userInfo().homedir;
  var macaroonPath = '';
  var lndConfigPath = '';
  switch (platform) {
    case 'win32':
      macaroonPath = homeDir + '\\AppData\\Local\\Lnd\\data\\chain\\bitcoin\\mainnet';
      lndConfigPath = homeDir + '\\AppData\\Local\\Lnd\\lnd.conf';
      break;
    case 'darwin':
      macaroonPath = homeDir + '/Library/Application Support/Lnd/data/chain/bitcoin/mainnet';
      lndConfigPath = homeDir + '/Library/Application Support/Lnd/lnd.conf';
      break;
    case 'linux':
      macaroonPath = homeDir + '/.lnd/data/chain/bitcoin/mainnet';
      lndConfigPath = homeDir + '/.lnd/lnd.conf';
      break;
    default:
      macaroonPath = '';
      lndConfigPath = '';
      break;
  }  
  return {
    Authentication: {
      macaroonPath: macaroonPath,
      nodeAuthType: 'DEFAULT',
      lndConfigPath: lndConfigPath,
      rtlPass: ''
    },
    Settings: {
      flgSidenavOpened: true,
      flgSidenavPinned: true,
      menu: 'Vertical',
      menuType: 'Regular',
      theme: 'dark-blue',
      satsToBTC: false,
      lndServerUrl: 'https://localhost:8080/v1',
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

const normalizePort = val => {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

const setMacaroonPath = (clArgs, config) => {
  if(undefined !== clArgs.lndir) {
    common.macaroon_path = clArgs.lndir;
  } else if (undefined !== process.env.MACAROON_PATH) {
    common.macaroon_path = process.env.MACAROON_PATH;
  } else {
    if(undefined !== config.Authentication.macroonPath && config.Authentication.macroonPath !== '') {
      common.macaroon_path = config.Authentication.macroonPath;
    } else if(undefined !== config.Authentication.macaroonPath && config.Authentication.macaroonPath !== '') {
      common.macaroon_path = config.Authentication.macaroonPath;
    }
  }
}

const validateConfigFile = (config) => {
  if(common.macaroon_path === '' || undefined === common.macaroon_path) {
    errMsg = 'Please set macaroon path through environment or RTL.conf!';
  }
  
  if(undefined !== process.env.LND_SERVER_URL) {
    common.lnd_server_url = process.env.LND_SERVER_URL;
  } else {
    if((config.Authentication.lndServerUrl === '' ||  undefined === config.Authentication.lndServerUrl) && (config.Settings.lndServerUrl === '' ||  undefined === config.Settings.lndServerUrl)) {
      errMsg = errMsg + '\nPlease set LND Server URL through environment or RTL.conf!';
    } else {
      if (config.Settings.lndServerUrl !== '' &&  undefined !== config.Settings.lndServerUrl) {
        common.lnd_server_url = config.Settings.lndServerUrl;
      } else if (config.Authentication.lndServerUrl !== '' &&  undefined !== config.Authentication.lndServerUrl) {
        common.lnd_server_url = config.Authentication.lndServerUrl;
      } 
    }
  }

  if(undefined !== process.env.NODE_AUTH_TYPE) {
    common.node_auth_type = process.env.NODE_AUTH_TYPE;
  } else {
    if(config.Authentication.nodeAuthType === '' ||  undefined === config.Authentication.nodeAuthType) {
      errMsg = errMsg + '\nPlease set Node Auth Type through environment/RTL.conf!';
    } else {
      common.node_auth_type = config.Authentication.nodeAuthType;
    }
  }

  if(undefined !== process.env.LND_CONFIG_PATH) {
    common.lnd_config_path = process.env.LND_CONFIG_PATH;
  } else {
    if(config.Authentication.lndConfigPath !== '' &&  undefined !== config.Authentication.lndConfigPath) {
      common.lnd_config_path = config.Authentication.lndConfigPath;
    } else {
      if(upperCase(common.node_auth_type) === 'DEFAULT') {
        errMsg = errMsg + '\nDefault Node Authentication can be set with LND Config Path only. Please set LND Config Path through environment or RTL.conf!';
      }    
    }
  }

  if(undefined !== process.env.BITCOIND_CONFIG_PATH) {
    common.bitcoind_config_path = process.env.BITCOIND_CONFIG_PATH;
  } else {
    if(config.Settings.bitcoindConfigPath !== '' ||  undefined !== config.Settings.bitcoindConfigPath) {
      common.bitcoind_config_path = config.Settings.bitcoindConfigPath;
    } else if(config.Authentication.bitcoindConfigPath !== '' ||  undefined !== config.Authentication.bitcoindConfigPath) {
      common.bitcoind_config_path = config.Authentication.bitcoindConfigPath;
    }
  }

	if (undefined !== process.env.RTL_PASS) {
		common.rtl_pass = process.env.RTL_PASS;
	} else if (config.Authentication.rtlPass !== '' || undefined !== config.Authentication.rtlPass) {
		common.rtl_pass = config.Authentication.rtlPass;

	}

	if (upperCase(common.node_auth_type) === 'CUSTOM' && (common.rtl_pass === '' || undefined === common.rtl_pass)) {
		errMsg = errMsg + '\nCustom Node Authentication can be set with RTL password only. Please set RTL Password through environment/RTL.conf';
	}

	if (undefined !== process.env.ENABLE_LOGGING) {
		common.enable_logging = process.env.ENABLE_LOGGING;
	} else if (undefined !== config.Settings.enableLogging) {
		common.enable_logging = config.Settings.enableLogging;
	} else if (undefined !== config.Authentication.enableLogging) {
		common.enable_logging = config.Authentication.enableLogging;
	}
	if (common.enable_logging) {
		common.log_file = common.rtl_conf_file_path + '/logs/RTL.log';
		let exists = fs.existsSync(common.log_file);
		if (exists) {
			fs.writeFile(common.log_file, '', () => { });
    } else if ((!exists && config.Authentication.enableLogging) || (!exists && config.Settings.enableLogging)) {
			try {
				var dirname = path.dirname(common.log_file);
				createDirectory(dirname);
				var createStream = fs.createWriteStream(common.log_file);
				createStream.end();
			}
			catch (err) {
				console.error('Something went wrong while creating log file: \n' + err);
			}
		}
	}

  if (undefined !== process.env.PORT) {
		common.port = normalizePort(process.env.PORT);
	} else if (undefined !== config.Settings.port) {
		common.port = normalizePort(config.Settings.port);
	}

  setSSOParams(config);
	if (errMsg !== '') {
		throw new Error(errMsg);
	}
}

const setSSOParams = (config) => {
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
    connect.readCookie(common.rtl_cookie_path);
  }
};

const createDirectory = (dirname) => {
  try {
    fs.mkdirSync(dirname);
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
    common.cookie = fs.readFileSync(cookieFile, 'utf-8');
  } else {
    try {
      var dirname = path.dirname(cookieFile);
      createDirectory(dirname);
      fs.writeFileSync(cookieFile, crypto.randomBytes(64).toString('hex'));
      common.cookie = fs.readFileSync(cookieFile, 'utf-8');
    }
    catch(err) {
      console.error('Something went wrong while reading cookie: \n' + err);
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

String.random = function (length) {
	let radom13chars = function () {
		return Math.random().toString(16).substring(2, 15).toUpperCase();
	}
	let loops = Math.ceil(length / 13);
	return new Array(loops).fill(radom13chars).reduce((string, func) => {
		return string + func();
	}, '').substring(-length);
}

const logEnvVariables = () => {
  if (!common.enable_logging) {
    return;
  }
  logger.info('\r\nConfig Setup Variable PORT: ' + common.port);
  logger.info('\r\nConfig Setup Variable LND_SERVER_URL: ' + common.lnd_server_url);
  logger.info('\r\nConfig Setup Variable MACAROON_PATH: ' + common.macaroon_path);
  logger.info('\r\nConfig Setup Variable NODE_AUTH_TYPE: ' + common.node_auth_type);
  logger.info('\r\nConfig Setup Variable LND_CONFIG_PATH: ' + common.lnd_config_path);
  logger.info('\r\nConfig Setup Variable RTL_CONFIG_PATH: ' + common.rtl_conf_file_path);
  logger.info('\r\nConfig Setup Variable BITCOIND_CONFIG_PATH: ' + common.bitcoind_config_path);
  logger.info('\r\nConfig Setup Variable RTL_SSO: ' + common.rtl_sso);
  logger.info('\r\nConfig Setup Variable RTL_COOKIE_PATH: ' + common.rtl_cookie_path);
  logger.info('\r\nConfig Setup Variable LOGOUT_REDIRECT_LINK: ' + common.logout_redirect_link);
}

var errMsg = '';
connect.configFileExists = () => {
  common.rtl_conf_file_path = (undefined !== process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH.substring(0, process.env.RTL_CONFIG_PATH.length - 9) : path.normalize(__dirname);
  RTLConfFile = common.rtl_conf_file_path + '/RTL.conf';
  let exists = fs.existsSync(RTLConfFile);
  if (exists) {
    var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    setMacaroonPath(clArgs, config)
    validateConfigFile(config);
    logEnvVariables();
  } else {
    try {
      fs.writeFileSync(RTLConfFile, ini.stringify(setDefaultConfig()));
      var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      setMacaroonPath(clArgs, config)
      validateConfigFile(config);
      logEnvVariables();      
    }
    catch(err) {
      console.error('Something went wrong while configuring the server: \n' + err);
      throw new Error(err);
    }
  }
}

module.exports = connect;

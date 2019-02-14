var fs = require('fs');
var clArgs = require('optimist').argv;
var ini = require('ini');
var common = require('./common');
var path = require('path');
var upperCase = require('upper-case');
var logger = require('./controllers/logger');
var options = {};

var defaultConfig = {
  Authentication: {
    lndServerUrl:'https://localhost:8080/v1',
    macaroonPath:'',
    nodeAuthType:'DEFAULT',
    lndConfigPath:'',
    bitcoindConfigPath: '',
    rtlPass:'',
    enableLogging: false
  },
  Settings: {
    flgSidenavOpened:true,
    flgSidenavPinned:true,
    menu:'Vertical',
    menuType:'Regular',
    theme:'dark-blue',
    satsToBTC:false
  }
};

var setMacaroonPath = (clArgs, config) => {
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

var validateConfigFile = (config) => {
  if(common.macaroon_path === '' || undefined === common.macaroon_path) {
    errMsg = 'Please set macaroon path through environment/RTL.conf!';
  }
  
  if(undefined !== process.env.LND_SERVER_URL) {
    common.lnd_server_url = process.env.LND_SERVER_URL;
  } else {
    if(config.Authentication.lndServerUrl === '' ||  undefined === config.Authentication.lndServerUrl) {
      errMsg = errMsg + '\nPlease set LND Server URL through environment/RTL.conf!';
    } else {
      common.lnd_server_url = config.Authentication.lndServerUrl;
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
        errMsg = errMsg + '\nDefault Node Authentication can be set with LND Config Path only. Please set LND Config Path through environment/RTL.conf!';
      }    
    }
  }

  if(undefined !== process.env.BITCOIND_CONFIG_PATH) {
    common.bitcoind_config_path = process.env.BITCOIND_CONFIG_PATH;
  } else {
    if(config.Authentication.bitcoindConfigPath !== '' ||  undefined !== config.Authentication.bitcoindConfigPath) {
      common.bitcoind_config_path = config.Authentication.bitcoindConfigPath;
    }
  }

  if(upperCase(common.node_auth_type) === 'CUSTOM' && (config.Authentication.rtlPass === '' ||  undefined === config.Authentication.rtlPass)) {
    errMsg = errMsg + '\nCustom Node Authentication can be set with RTL password only. Please set RTL Password in RTL.conf';
  }

  if(undefined !== config.Authentication.enableLogging) {
    common.enable_logging = config.Authentication.enableLogging;
    common.log_file = common.rtl_conf_file_path + '/logs/RTL.log';
    let exists = fs.existsSync(common.log_file);
    if(exists) {
      fs.writeFile(common.log_file, '', () => {});
    } else if (!exists && config.Authentication.enableLogging) {
      try {
        var dirname = path.dirname(common.log_file);
        createDirectory(dirname);
        var createStream = fs.createWriteStream(common.log_file);
        createStream.end();
      }
      catch(err) {
        console.error('Something went wrong, unable to create log file!' + err);
      }
    } 
  }

  if(errMsg !== '') {
    throw new Error(errMsg);
  }
}

var setSSOParams = () => {
  if(undefined !== process.env.RTL_SSO) {
    common.rtl_sso = process.env.RTL_SSO;

    if(undefined !== process.env.LOGOUT_REDIRECT_LINK) {
      common.logout_redirect_link = process.env.LOGOUT_REDIRECT_LINK;
    }

    if(undefined !== process.env.RTL_COOKIE_PATH) {
      common.rtl_cookie_path = process.env.RTL_COOKIE_PATH;
    } else {
      common.rtl_cookie_path = common.rtl_conf_file_path + '/cookies/auth.cookie';
    }
    
    readCookie(common.rtl_cookie_path);
  }
};

var createDirectory = (dirname) => {
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

var readCookie = (cookieFile) => {
  let exists = fs.existsSync(cookieFile);
  if (exists) {
    common.cookie = fs.readFileSync(cookieFile, 'utf-8');
  } else {
    try {
      var dirname = path.dirname(cookieFile);
      createDirectory(dirname);
      fs.writeFileSync(cookieFile, String.random(50));
      common.cookie = fs.readFileSync(cookieFile, 'utf-8');
    }
    catch(err) {
      console.error('Something went wrong, unable to create cookie file!\n' + err);
      throw new Error(err);
    }
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

var setOptions = () => {
  var macaroon = fs.readFileSync(common.macaroon_path + '/admin.macaroon').toString('hex');
  options = {
    url: '',
    rejectUnauthorized: false,
    json: true,
    headers: {
      'Grpc-Metadata-macaroon': macaroon,
    },
    form: ''
  };
}

var logEnvVariables = () => {
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
var configFileExists = () => {
  common.rtl_conf_file_path = (undefined !== process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH.substring(0, process.env.RTL_CONFIG_PATH.length - 9) : path.normalize(__dirname);
  RTLConfFile = common.rtl_conf_file_path + '/RTL.conf';
  let exists = fs.existsSync(RTLConfFile);
  if (exists) {
    var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    setMacaroonPath(clArgs, config)
    validateConfigFile(config);
    setOptions();
    setSSOParams();
    logEnvVariables();
  } else {
    try {
      fs.writeFileSync(RTLConfFile, ini.stringify(defaultConfig));
      var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      setMacaroonPath(clArgs, config)
      validateConfigFile(config);
      setOptions();
      setSSOParams();
      logEnvVariables();
    }
    catch(err) {
      console.error('Something went wrong, unable to create config file!\n' + err);
      throw new Error(err);
    }
  }
}
configFileExists();
module.exports = options;

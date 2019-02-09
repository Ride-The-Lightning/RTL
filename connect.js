var fs = require('fs');
var clArgs = require('optimist').argv;
var ini = require('ini');
var common = require('./common');
var upperCase = require('upper-case');
var path = require('path');
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
  } else if (undefined !== clArgs.macaroonPath) {
    common.macaroon_path = clArgs.macaroonPath;
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
  
  if(undefined !== clArgs.lndServerUrl) {
    common.lnd_server_url = clArgs.lndServerUrl;
  } else {
    if(config.Authentication.lndServerUrl === '' ||  undefined === config.Authentication.lndServerUrl) {
      errMsg = errMsg + '\nPlease set LND Server URL through environment/RTL.conf!';
    } else {
      common.lnd_server_url = config.Authentication.lndServerUrl;
    }
  }

  if(undefined !== clArgs.nodeAuthType) {
    common.node_auth_type = clArgs.nodeAuthType;
  } else {
    if(config.Authentication.nodeAuthType === '' ||  undefined === config.Authentication.nodeAuthType) {
      errMsg = errMsg + '\nPlease set Node Auth Type through environment/RTL.conf!';
    } else {
      common.node_auth_type = config.Authentication.nodeAuthType;
    }
  }

  if(undefined !== clArgs.lndConfigPath) {
    common.lnd_config_path = clArgs.lndConfigPath;
  } else {
    if(config.Authentication.lndConfigPath !== '' &&  undefined !== config.Authentication.lndConfigPath) {
      common.lnd_config_path = config.Authentication.lndConfigPath;
    } else {
      if(upperCase(common.node_auth_type) === 'DEFAULT') {
        errMsg = errMsg + '\nDefault Node Authentication can be set with LND Config Path only. Please set LND Config Path through environment/RTL.conf!';
      }    
    }
  }

  if(undefined !== clArgs.bitcoindConfigPath) {
    common.bitcoind_config_path = clArgs.bitcoindConfigPath;
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
    var logFile = common.rtl_conf_file_path + '/RTL.log';
    let exists = fs.existsSync(logFile);
    if(exists) {
      fs.writeFile(logFile, '', () => {});
    } else if (!exists && config.Authentication.enableLogging) {
      try {
        var createStream = fs.createWriteStream(logFile);
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

var errMsg = '';
var configFileExists = () => {
  common.rtl_conf_file_path = (undefined !== clArgs.rtlConfFilePath) ? clArgs.rtlConfFilePath : path.normalize(__dirname);
  RTLConfFile = common.rtl_conf_file_path + '/RTL.conf';
  let exists = fs.existsSync(RTLConfFile);
  if (exists) {
    var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    setMacaroonPath(clArgs, config)
    validateConfigFile(config);
    setOptions();
  } else {
    try {
      fs.writeFileSync(RTLConfFile, ini.stringify(defaultConfig));
      var config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      setMacaroonPath(clArgs, config)
      validateConfigFile(config);
      setOptions();
    }
    catch(err) {
      console.error('Something went wrong, unable to create config file!\n' + err);
      throw new Error(err);
    }
  }
}
configFileExists();
module.exports = options;

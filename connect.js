var fs = require('fs');
var clArgs = require('optimist').argv;
var ini = require('ini');
var file_path = './RTL.conf';  
var common = require('./common');
var upperCase = require('upper-case');
var macaroonPath = '';
var options = {};

var defaultConfig = {
  authentication: {
    lndServerUrl:'https://localhost:8080/v1',
    macroonPath:'',
    nodeAuthType:'DEFAULT',
    lndConfigPath:'',
    rtlPass:''
  },
  settings: {
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
    macaroonPath = clArgs.lndir;
  } else {
    if(config.Authentication.macroonPath !== '') {
      macaroonPath = config.Authentication.macroonPath;
    }
  }
}

var validateConfigFile = (macaroonPath, config) => {
  if(macaroonPath === '' || undefined === macaroonPath) {
    errMsg = 'Please set macaroon path in RTL.conf';
  }
  
  if(config.Authentication.lndServerUrl === '' ||  undefined === config.Authentication.lndServerUrl) {
    errMsg = errMsg + '\nPlease set LND Server URL in RTL.conf';
  } else {
    common.lnd_server_url = config.Authentication.lndServerUrl;
  }
  
  if(config.Authentication.nodeAuthType === '' ||  undefined === config.Authentication.nodeAuthType) {
    errMsg = errMsg + '\nPlease set Node Auth Type in RTL.conf';
  }
  
  if(upperCase(config.Authentication.nodeAuthType) === 'DEFAULT' && (config.Authentication.lndConfigPath === '' ||  undefined === config.Authentication.lndConfigPath)) {
    errMsg = errMsg + '\nDefault Node Authentication can be set with LND Config Path only. Please set LND Config Path in RTL.conf';
  }

  if(upperCase(config.Authentication.nodeAuthType) === 'CUSTOM' && (config.Authentication.rtlPass === '' ||  undefined === config.Authentication.rtlPass)) {
    errMsg = errMsg + '\nCustom Node Authentication can be set with RTL password only. Please set RTL Password in RTL.conf';
  }

  if(errMsg !== '') {
    throw new Error(errMsg);
  }
}

var setOptions = (macaroonPath) => {
  var macaroon = fs.readFileSync(macaroonPath + '/admin.macaroon').toString('hex');
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
  let exists = fs.existsSync(file_path);
  if (exists) {
    var config = ini.parse(fs.readFileSync(file_path, 'utf-8'));
    setMacaroonPath(clArgs, config)
    validateConfigFile(macaroonPath, config);
    setOptions(macaroonPath);
  } else {
    try {
      fs.writeFileSync(file_path, ini.stringify(defaultConfig));
      var config = ini.parse(fs.readFileSync(file_path, 'utf-8'));
      setMacaroonPath(clArgs, config)
      validateConfigFile(macaroonPath, config);
      setOptions(macaroonPath);
    }
    catch(err) {
      console.error('Something went wrong, unable to create config file!' + err);
    }
  }
}
configFileExists();
module.exports = options;

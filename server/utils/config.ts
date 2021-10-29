import * as os from 'os';
import * as fs from 'fs';
import { join, dirname, isAbsolute, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import ini from 'ini';
import parseHocon from 'hocon-parser';
import { Common, CommonService } from './common.js';
import { Logger, LoggerService } from './logger.js';

export class ConfigService {

  private platform = os.platform();
  private hash = crypto.createHash('sha256');
  private errMsg = '';
  private directoryName = dirname(fileURLToPath(import.meta.url));
  private common: CommonService = Common;
  private logger: LoggerService = Logger;

  constructor() { }

  setDefaultConfig = () => {
    const homeDir = os.userInfo().homedir;
    let macaroonPath = '';
    let configPath = '';
    let channelBackupPath = '';
    switch (this.platform) {
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
      multiPass: 'password',
      port: '3000',
      defaultNodeIndex: 1,
      SSO: {
        rtlSSO: 0,
        rtlCookiePath: '',
        logoutRedirectLink: ''
      },
      nodes: [
        {
          index: 1,
          lnNode: 'Node 1',
          lnImplementation: 'LND',
          Authentication: {
            macaroonPath: macaroonPath,
            configPath: configPath
          },
          Settings: {
            userPersona: 'MERCHANT',
            themeMode: 'DAY',
            themeColor: 'PURPLE',
            channelBackupPath: channelBackupPath,
            logLevel: 'ERROR',
            lnServerUrl: 'https://localhost:8080',
            fiatConversion: false
          }
        }
      ]
    };
  }

  private normalizePort = (val) => {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
      return val;
    }
    if (port >= 0) {
      return port;
    }
    return false;
  };

  private updateLogByLevel = () => {
    let updateLogFlag = false;
    this.common.rtl_conf_file_path = process.env.RTL_CONFIG_PATH ? process.env.RTL_CONFIG_PATH : join(this.directoryName, '../..');
    try {
      const RTLConfFile = this.common.rtl_conf_file_path + this.common.path_separator + 'RTL-Config.json';
      const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      config.nodes.forEach((node) => {
        if (node.Settings.hasOwnProperty('enableLogging')) {
          updateLogFlag = true;
          node.Settings.logLevel = node.Settings.enableLogging ? 'INFO' : 'ERROR';
          delete node.Settings.enableLogging;
        }
      });
      if (updateLogFlag) {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
      }
    } catch (err) {
      this.errMsg = this.errMsg + '\nLog level update failed!';
    }
  }

  private validateNodeConfig = (config) => {
    if ((+process.env.RTL_SSO === 0) || (typeof process.env.RTL_SSO === 'undefined' && +config.SSO.rtlSSO === 0)) {
      if (config.multiPassHashed !== '' && config.multiPassHashed) {
        this.common.rtl_pass = config.multiPassHashed;
      } else if (config.multiPass !== '' && config.multiPass) {
        this.common.rtl_pass = this.common.replacePasswordWithHash(this.hash.update(config.multiPass).digest('hex'));
      } else {
        this.errMsg = this.errMsg + '\nNode Authentication can be set with multiPass only. Please set multiPass in RTL-Config.json';
      }
      this.common.rtl_secret2fa = config.secret2fa;
    }
    this.common.port = (process.env.PORT) ? this.normalizePort(process.env.PORT) : (config.port) ? this.normalizePort(config.port) : 3000;
    this.common.host = (process.env.HOST) ? process.env.HOST : (config.host) ? config.host : null;
    if (config.nodes && config.nodes.length > 0) {
      config.nodes.forEach((node, idx) => {
        this.common.nodes[idx] = {};
        this.common.nodes[idx].index = node.index;
        this.common.nodes[idx].ln_node = node.lnNode;
        this.common.nodes[idx].ln_implementation = (process.env.LN_IMPLEMENTATION) ? process.env.LN_IMPLEMENTATION : node.lnImplementation ? node.lnImplementation : 'LND';
        if (this.common.nodes[idx].ln_implementation !== 'ECL' && process.env.MACAROON_PATH && process.env.MACAROON_PATH.trim() !== '') {
          this.common.nodes[idx].macaroon_path = process.env.MACAROON_PATH;
        } else if (this.common.nodes[idx].ln_implementation !== 'ECL' && node.Authentication && node.Authentication.macaroonPath && node.Authentication.macaroonPath.trim() !== '') {
          this.common.nodes[idx].macaroon_path = node.Authentication.macaroonPath;
        } else if (this.common.nodes[idx].ln_implementation !== 'ECL') {
          this.errMsg = 'Please set macaroon path for node index ' + node.index + ' in RTL-Config.json!';
        }

        if (this.common.nodes[idx].ln_implementation === 'ECL') {
          if (process.env.LN_API_PASSWORD) {
            this.common.nodes[idx].ln_api_password = process.env.LN_API_PASSWORD;
          } else if (node.Authentication && node.Authentication.lnApiPassword) {
            this.common.nodes[idx].ln_api_password = node.Authentication.lnApiPassword;
          } else {
            this.common.nodes[idx].ln_api_password = '';
          }
        }
        if (process.env.CONFIG_PATH) {
          this.common.nodes[idx].config_path = process.env.CONFIG_PATH;
        } else if (process.env.LND_CONFIG_PATH) {
          this.common.nodes[idx].config_path = process.env.LND_CONFIG_PATH;
        } else if (node.Authentication && node.Authentication.lndConfigPath) {
          this.common.nodes[idx].config_path = node.Authentication.lndConfigPath;
        } else if (node.Authentication && node.Authentication.configPath) {
          this.common.nodes[idx].config_path = node.Authentication.configPath;
        } else {
          this.common.nodes[idx].config_path = '';
        }
        if (this.common.nodes[idx].ln_implementation === 'ECL' && this.common.nodes[idx].ln_api_password === '' && this.common.nodes[idx].config_path !== '') {
          try {
            const exists = fs.existsSync(this.common.nodes[idx].config_path);
            if (exists) {
              try {
                const configFile = fs.readFileSync(this.common.nodes[idx].config_path, 'utf-8');
                const iniParsed = ini.parse(configFile);
                this.common.nodes[idx].ln_api_password = iniParsed['eclair.api.password'] ? iniParsed['eclair.api.password'] : parseHocon(configFile).eclair.api.password;
              } catch (err) {
                this.errMsg = this.errMsg + '\nSomething went wrong while reading config file: \n' + err;
              }
            } else {
              this.errMsg = this.errMsg + '\nInvalid config path: ' + this.common.nodes[idx].config_path;
            }
          } catch (err) {
            this.errMsg = this.errMsg + '\nUnable to read config file: \n' + err;
          }
        }
        if (this.common.nodes[idx].ln_implementation === 'ECL' && this.common.nodes[idx].ln_api_password === '') {
          this.errMsg = this.errMsg + '\nPlease set config path Or api password for node index ' + node.index + ' in RTL-Config.json! It is mandatory for Eclair authentication!';
        }

        if (process.env.LN_SERVER_URL && process.env.LN_SERVER_URL.trim() !== '') {
          this.common.nodes[idx].ln_server_url = process.env.LN_SERVER_URL.endsWith('/v1') ? process.env.LN_SERVER_URL.slice(0, -3) : process.env.LN_SERVER_URL;
        } else if (process.env.LND_SERVER_URL && process.env.LND_SERVER_URL.trim() !== '') {
          this.common.nodes[idx].ln_server_url = process.env.LND_SERVER_URL.endsWith('/v1') ? process.env.LND_SERVER_URL.slice(0, -3) : process.env.LND_SERVER_URL;
        } else if (node.Settings.lnServerUrl && node.Settings.lnServerUrl.trim() !== '') {
          this.common.nodes[idx].ln_server_url = node.Settings.lnServerUrl.endsWith('/v1') ? node.Settings.lnServerUrl.slice(0, -3) : node.Settings.lnServerUrl;
        } else if (node.Settings.lndServerUrl && node.Settings.lndServerUrl.trim() !== '') {
          this.common.nodes[idx].ln_server_url = node.Settings.lndServerUrl.endsWith('/v1') ? node.Settings.lndServerUrl.slice(0, -3) : node.Settings.lndServerUrl;
        } else {
          this.errMsg = this.errMsg + '\nPlease set LN Server URL for node index ' + node.index + ' in RTL-Config.json!';
        }
        this.common.nodes[idx].user_persona = node.Settings.userPersona ? node.Settings.userPersona : 'MERCHANT';
        this.common.nodes[idx].theme_mode = node.Settings.themeMode ? node.Settings.themeMode : 'DAY';
        this.common.nodes[idx].theme_color = node.Settings.themeColor ? node.Settings.themeColor : 'PURPLE';
        this.common.nodes[idx].log_level = node.Settings.logLevel ? node.Settings.logLevel : 'ERROR';
        this.common.nodes[idx].fiat_conversion = node.Settings.fiatConversion ? !!node.Settings.fiatConversion : false;
        if (this.common.nodes[idx].fiat_conversion) {
          this.common.nodes[idx].currency_unit = node.Settings.currencyUnit ? node.Settings.currencyUnit : 'USD';
        }
        if (process.env.SWAP_SERVER_URL && process.env.SWAP_SERVER_URL.trim() !== '') {
          this.common.nodes[idx].swap_server_url = process.env.SWAP_SERVER_URL.endsWith('/v1') ? process.env.SWAP_SERVER_URL.slice(0, -3) : process.env.SWAP_SERVER_URL;
          this.common.nodes[idx].swap_macaroon_path = process.env.SWAP_MACAROON_PATH;
        } else if (node.Settings.swapServerUrl && node.Settings.swapServerUrl.trim() !== '') {
          this.common.nodes[idx].swap_server_url = node.Settings.swapServerUrl.endsWith('/v1') ? node.Settings.swapServerUrl.slice(0, -3) : node.Settings.swapServerUrl;
          this.common.nodes[idx].swap_macaroon_path = node.Authentication.swapMacaroonPath ? node.Authentication.swapMacaroonPath : '';
        } else {
          this.common.nodes[idx].swap_server_url = '';
          this.common.nodes[idx].swap_macaroon_path = '';
        }
        if (process.env.BOLTZ_SERVER_URL && process.env.BOLTZ_SERVER_URL.trim() !== '') {
          this.common.nodes[idx].boltz_server_url = process.env.BOLTZ_SERVER_URL.endsWith('/v1') ? process.env.BOLTZ_SERVER_URL.slice(0, -3) : process.env.BOLTZ_SERVER_URL;
          this.common.nodes[idx].boltz_macaroon_path = process.env.BOLTZ_MACAROON_PATH;
        } else if (node.Settings.boltzServerUrl && node.Settings.boltzServerUrl.trim() !== '') {
          this.common.nodes[idx].boltz_server_url = node.Settings.boltzServerUrl.endsWith('/v1') ? node.Settings.boltzServerUrl.slice(0, -3) : node.Settings.boltzServerUrl;
          this.common.nodes[idx].boltz_macaroon_path = node.Authentication.boltzMacaroonPath ? node.Authentication.boltzMacaroonPath : '';
        } else {
          this.common.nodes[idx].boltz_server_url = '';
          this.common.nodes[idx].boltz_macaroon_path = '';
        }
        this.common.nodes[idx].bitcoind_config_path = process.env.BITCOIND_CONFIG_PATH ? process.env.BITCOIND_CONFIG_PATH : (node.Settings.bitcoindConfigPath) ? node.Settings.bitcoindConfigPath : '';
        this.common.nodes[idx].channel_backup_path = process.env.CHANNEL_BACKUP_PATH ? process.env.CHANNEL_BACKUP_PATH : (node.Settings.channelBackupPath) ? node.Settings.channelBackupPath : this.common.rtl_conf_file_path + this.common.path_separator + 'channels-backup' + this.common.path_separator + 'node-' + node.index;
        try {
          this.createDirectory(this.common.nodes[idx].channel_backup_path);
          const exists = fs.existsSync(this.common.nodes[idx].channel_backup_path + this.common.path_separator + 'channel-all.bak');
          if (!exists) {
            try {
              if (this.common.nodes[idx].ln_implementation === 'LND') {
                this.common.getAllNodeAllChannelBackup(this.common.nodes[idx]);
              } else {
                const createStream = fs.createWriteStream(this.common.nodes[idx].channel_backup_path + this.common.path_separator + 'channel-all.bak');
                createStream.end();
              }
            } catch (err) {
              this.logger.log({ level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating backup file: \n' + err });
            }
          }
        } catch (err) {
          this.logger.log({ level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating the backup directory: \n' + err });
        }
        this.common.nodes[idx].log_file = this.common.rtl_conf_file_path + '/logs/RTL-Node-' + node.index + '.log';
        this.logger.log({ level: 'DEBUG', fileName: 'Config', msg: 'Node Information', data: this.common.nodes[idx] });
        const log_file = this.common.nodes[idx].log_file;
        if (fs.existsSync(log_file)) {
          fs.writeFile(log_file, '', () => { });
        } else {
          try {
            const directoryName = dirname(log_file);
            this.createDirectory(directoryName);
            const createStream = fs.createWriteStream(log_file);
            createStream.end();
          } catch (err) {
            this.logger.log({ level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating log file ' + log_file + ': \n' + err });
          }
        }
      });
    }
    this.setSSOParams(config);
    if (this.errMsg && this.errMsg.trim() !== '') { throw new Error(this.errMsg); }
  }

  private setSSOParams = (config) => {
    if (process.env.RTL_SSO) {
      this.common.rtl_sso = +process.env.RTL_SSO;
    } else if (config.SSO && config.SSO.rtlSSO) {
      this.common.rtl_sso = config.SSO.rtlSSO;
    }

    if (process.env.RTL_COOKIE_PATH) {
      this.common.rtl_cookie_path = process.env.RTL_COOKIE_PATH;
    } else if (config.SSO && config.SSO.rtlCookiePath) {
      this.common.rtl_cookie_path = config.SSO.rtlCookiePath;
    } else {
      this.common.rtl_cookie_path = '';
    }

    if (process.env.LOGOUT_REDIRECT_LINK) {
      this.common.logout_redirect_link = process.env.LOGOUT_REDIRECT_LINK;
    } else if (config.SSO && config.SSO.logoutRedirectLink) {
      this.common.logout_redirect_link = config.SSO.logoutRedirectLink;
    }

    if (+this.common.rtl_sso) {
      if (!this.common.rtl_cookie_path || this.common.rtl_cookie_path.trim() === '') {
        this.errMsg = 'Please set rtlCookiePath value for single sign on option!';
      } else {
        this.readCookie(this.common.rtl_cookie_path);
      }
    }
  };

  private createDirectory = (directoryName) => {
    const initDir = isAbsolute(directoryName) ? sep : '';
    directoryName.split(sep).reduce((parentDir, childDir) => {
      const curDir = resolve(parentDir, childDir);
      try {
        if (!fs.existsSync(curDir)) {
          fs.mkdirSync(curDir);
        }
      } catch (err) {
        if (err.code !== 'EEXIST') {
          if (err.code === 'ENOENT') {
            throw new Error(`ENOENT: No such file or directory, mkdir '${directoryName}'. Ensure that channel backup path separator is '${(this.platform === 'win32') ? '\\\\' : '/'}'`);
          } else {
            throw err;
          }
        }
      }
      return curDir;
    }, initDir);
  }

  private readCookie = (cookieFile) => {
    const exists = fs.existsSync(cookieFile);
    if (exists) {
      try {
        this.common.cookie = fs.readFileSync(cookieFile, 'utf-8');
      } catch (err) {
        this.logger.log({ level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while reading cookie: \n' + err });
        throw new Error(err);
      }
    } else {
      try {
        const directoryName = dirname(cookieFile);
        this.createDirectory(directoryName);
        fs.writeFileSync(cookieFile, crypto.randomBytes(64).toString('hex'));
        this.common.cookie = fs.readFileSync(cookieFile, 'utf-8');
      } catch (err) {
        this.logger.log({ level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while reading the cookie: \n' + err });
        throw new Error(err);
      }
    }
  }

  private setSelectedNode = (config) => {
    if (config.defaultNodeIndex) {
      this.common.initSelectedNode = this.common.findNode(config.defaultNodeIndex);
    } else {
      this.common.initSelectedNode = this.common.findNode(this.common.nodes[0].index);
    }
  }

  private modifyJsonMultiNodeConfig = (confFileFullPath) => {
    const RTLConfFile = this.common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
    const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    if (!config.SSO) { config.SSO = {}; }
    const newConfig = {
      port: config.port ? config.port : 3000,
      defaultNodeIndex: config.defaultNodeIndex ? config.defaultNodeIndex : 1,
      SSO: {
        rtlSSO: config.SSO.rtlSSO ? config.SSO.rtlSSO : 0,
        rtlCookiePath: config.SSO.rtlCookiePath ? config.SSO.rtlCookiePath : '',
        logoutRedirectLink: config.SSO.logoutRedirectLink ? config.SSO.logoutRedirectLink : ''
      },
      nodes: []
    };
    if (config.host) { newConfig['host'] = config.host; }
    if (config.nodes && config.nodes.length > 0) {
      let newNode;
      config.nodes.forEach((node, idx) => {
        newNode = {
          index: node.index ? node.index : (idx + 1),
          lnNode: node.lnNode ? node.lnNode : 'Node ' + (idx + 1),
          lnImplementation: node.lnImplementation ? node.lnImplementation : 'LND',
          Authentication: {
            macaroonPath: node.Authentication.macaroonPath ? node.Authentication.macaroonPath : ''
          },
          Settings: {
            userPersona: node.Settings.userPersona ? node.Settings.userPersona : 'MERCHANT',
            logLevel: node.Settings.logLevel,
            fiatConversion: node.Settings.fiatConversion ? node.Settings.fiatConversion : false
          }
        };

        if (node.Authentication.configPath) {
          newNode.Authentication.configPath = node.Authentication.configPath;
        } else if (node.Authentication.lndConfigPath) {
          newNode.Authentication.configPath = node.Authentication.lndConfigPath;
        }

        if (node.Settings.theme) {
          const themeArr = node.Settings.theme.split('-');
          if (themeArr[2]) { themeArr[1] = themeArr[1] + themeArr[2]; } // For light-blue-gray
          newNode.Settings.themeMode = (themeArr[0] === 'dark') ? 'NIGHT' : 'DAY';
          newNode.Settings.themeColor = (themeArr[1] === 'blue') ? 'INDIGO' : (themeArr[1] === 'pink') ? 'PINK' : (themeArr[1] === 'green' || themeArr[1] === 'teal') ? 'TEAL' : 'PURPLE';
        } else {
          newNode.Settings.themeMode = node.Settings.themeMode ? node.Settings.themeMode : 'DAY';
          newNode.Settings.themeColor = node.Settings.themeColor ? node.Settings.themeColor : 'PURPLE';
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
    newConfig['multiPassHashed'] = config.multiPassHashed ? config.multiPassHashed : config.multiPass ? this.hash.update(config.multiPass).digest('hex') : '';
    fs.writeFileSync(confFileFullPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  }

  private modifyIniSingleNodeConfig = (confFileFullPath) => {
    const RTLConfFile = this.common.rtl_conf_file_path + '/RTL.conf';
    const config = ini.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    if (!config.SSO) { config.SSO = {}; }
    if (!config.Authentication) { config.Authentication = {}; }
    if (!config.Settings) { config.Settings = {}; }
    const newConfig = {
      port: config.Settings.port ? config.Settings.port : 3000,
      defaultNodeIndex: 1,
      SSO: {
        rtlSSO: config.SSO.rtlSSO ? config.SSO.rtlSSO : 0,
        rtlCookiePath: config.SSO.rtlCookiePath ? config.SSO.rtlCookiePath : '',
        logoutRedirectLink: config.SSO.logoutRedirectLink ? config.SSO.logoutRedirectLink : ''
      },
      nodes: [
        {
          index: 1,
          lnNode: 'Node 1',
          lnImplementation: config.Settings.lnImplementation ? config.Settings.lnImplementation : 'LND',
          Authentication: {
            macaroonPath: config.Authentication.macaroonPath ? config.Authentication.macaroonPath : (config.Authentication.macroonPath ? config.Authentication.macroonPath : ''),
            configPath: config.Authentication.configPath ? config.Authentication.configPath : (config.Authentication.lndConfigPath ? config.Authentication.lndConfigPath : '')
          },
          Settings: {
            userPersona: config.Settings.userPersona ? config.Settings.userPersona : 'MERCHANT',
            logLevel: config.Settings.logLevel ? config.Settings.logLevel : 'ERROR',
            fiatConversion: config.Settings.fiatConversion ? config.Settings.fiatConversion : false
          }
        }
      ]
    };
    if (config.Settings.theme) {
      const themeArr = config.Settings.theme.split('-');
      if (themeArr[2]) { themeArr[1] = themeArr[1] + themeArr[2]; } // For light-blue-gray
      newConfig.nodes[0].Settings['themeMode'] = (themeArr[0] === 'dark') ? 'NIGHT' : 'DAY';
      newConfig.nodes[0].Settings['themeColor'] = (themeArr[1] === 'blue') ? 'INDIGO' : (themeArr[1] === 'pink') ? 'PINK' : (themeArr[1] === 'green' || themeArr[1] === 'teal') ? 'TEAL' : 'PURPLE';
    } else {
      newConfig.nodes[0].Settings['themeMode'] = config.Settings.themeMode ? config.Settings.themeMode : 'DAY';
      newConfig.nodes[0].Settings['themeColor'] = config.Settings.themeColor ? config.Settings.themeColor : 'PURPLE';
    }
    if (config.Settings.currencyUnit) {
      newConfig.nodes[0].Settings['currencyUnit'] = config.Settings.currencyUnit;
    }

    if (config.Settings.bitcoindConfigPath) {
      newConfig.nodes[0].Settings['bitcoindConfigPath'] = config.Settings.bitcoindConfigPath;
    } else if (config.Authentication.bitcoindConfigPath) {
      newConfig.nodes[0].Settings['bitcoindConfigPath'] = config.Authentication.bitcoindConfigPath;
    }

    if (config.Settings.channelBackupPath) {
      newConfig.nodes[0].Settings['channelBackupPath'] = config.Settings.channelBackupPath;
    }
    if (config.Settings.lnServerUrl) {
      newConfig.nodes[0].Settings['lnServerUrl'] = config.Settings.lnServerUrl.endsWith('/v1') ? config.Settings.lnServerUrl.slice(0, -3) : config.Settings.lnServerUrl;
    } else if (config.Settings.lndServerUrl) {
      newConfig.nodes[0].Settings['lnServerUrl'] = config.Settings.lndServerUrl.endsWith('/v1') ? config.Settings.lndServerUrl.slice(0, -3) : config.Settings.lndServerUrl;
    } else if (config.Authentication.lndServerUrl) {
      newConfig.nodes[0].Settings['lnServerUrl'] = config.Authentication.lndServerUrl.endsWith('/v1') ? config.Authentication.lndServerUrl.slice(0, -3) : config.Authentication.lndServerUrl;
    }
    newConfig['multiPassHashed'] = config.Authentication.rtlPassHashed ? config.Authentication.rtlPassHashed : config.Authentication.rtlPass ? this.hash.update(config.Authentication.rtlPass).digest('hex') : '';
    fs.writeFileSync(confFileFullPath, JSON.stringify(newConfig, null, 2), 'utf-8');
  }

  private upgradeConfig = (confFileFullPath) => {
    try {
      const singleNodeConfFile = this.common.rtl_conf_file_path + '/RTL.conf';
      const multiNodeConfFile = this.common.rtl_conf_file_path + '/RTL-Multi-Node-Conf.json';
      const singleNodeExists = fs.existsSync(singleNodeConfFile);
      const multiNodeExists = fs.existsSync(multiNodeConfFile);
      if ((singleNodeExists && multiNodeExists) || (!singleNodeExists && multiNodeExists)) {
        this.logger.log({ level: 'INFO', fileName: 'Config', msg: 'Start...config migration for file', data: multiNodeConfFile });
        this.modifyJsonMultiNodeConfig(confFileFullPath);
        this.logger.log({ level: 'INFO', fileName: 'Config', msg: 'End...config migration' });
      } else if (singleNodeExists && !multiNodeExists) {
        this.logger.log({ level: 'INFO', fileName: 'Config', msg: 'Start...config migration for file ', data: singleNodeConfFile });
        this.modifyIniSingleNodeConfig(confFileFullPath);
        this.logger.log({ level: 'INFO', fileName: 'Config', msg: 'End...config migration' });
      } else if (!singleNodeExists && !multiNodeExists) {
        if (!fs.existsSync(confFileFullPath)) {
          this.logger.log({ level: 'INFO', fileName: 'Config', msg: 'Start...config creation at ', data: confFileFullPath });
          fs.writeFileSync(confFileFullPath, JSON.stringify(this.setDefaultConfig(), null, 2), 'utf-8');
          this.logger.log({ level: 'INFO', fileName: 'Config', msg: 'End...config creation' });
        }
      }
    } catch (err) {
      this.logger.log({ level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while upgrading the RTL config file: \n' + err });
      throw new Error(err);
    }
  }

  public setServerConfiguration = () => {
    try {
      this.common.rtl_conf_file_path = (process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH : join(this.directoryName, '../..');
      const confFileFullPath = this.common.rtl_conf_file_path + this.common.path_separator + 'RTL-Config.json';
      if (!fs.existsSync(confFileFullPath)) {
        this.upgradeConfig(confFileFullPath);
      }
      const config = JSON.parse(fs.readFileSync(confFileFullPath, 'utf-8'));
      this.updateLogByLevel();
      this.validateNodeConfig(config);
      this.setSelectedNode(config);
    } catch (err) {
      this.logger.log({ level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while configuring the node server: \n' + err });
      throw new Error(err);
    }
  };

}

export const Config = new ConfigService();

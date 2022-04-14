import * as os from 'os';
import * as fs from 'fs';
import { join, dirname, sep } from 'path';
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

  private setDefaultConfig = () => {
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
    const configData = {
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
    if (+process.env.RTL_SSO === 0) {
      configData['multiPass'] = 'password';
    }
    return configData;
  };

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
      const RTLConfFile = this.common.rtl_conf_file_path + sep + 'RTL-Config.json';
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
  };

  private validateNodeConfig = (config) => {
    if ((+process.env.RTL_SSO === 0) || (typeof process.env.RTL_SSO === 'undefined' && +config.SSO.rtlSSO === 0)) {
      if (process.env.APP_PASSWORD && process.env.APP_PASSWORD.trim() !== '') {
        this.common.rtl_pass = this.hash.update(process.env.APP_PASSWORD).digest('hex');
        this.common.flg_allow_password_update = false;
      } else if (config.multiPassHashed && config.multiPassHashed !== '') {
        this.common.rtl_pass = config.multiPassHashed;
      } else if (config.multiPass && config.multiPass !== '') {
        this.common.rtl_pass = this.common.replacePasswordWithHash(this.hash.update(config.multiPass).digest('hex'));
      } else {
        this.errMsg = this.errMsg + '\nNode Authentication can be set with multiPass only. Please set multiPass in RTL-Config.json';
      }
      this.common.rtl_secret2fa = config.secret2fa;
    } else {
      if (process.env.APP_PASSWORD && process.env.APP_PASSWORD.trim() !== '') {
        this.errMsg = this.errMsg + '\nRTL Password cannot be set with SSO. Please set SSO as 0 or remove password.';
      }
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
        this.common.nodes[idx].enable_offers = process.env.ENABLE_OFFERS ? process.env.ENABLE_OFFERS : (node.Settings.enableOffers) ? node.Settings.enableOffers : false;
        this.common.nodes[idx].bitcoind_config_path = process.env.BITCOIND_CONFIG_PATH ? process.env.BITCOIND_CONFIG_PATH : (node.Settings.bitcoindConfigPath) ? node.Settings.bitcoindConfigPath : '';
        this.common.nodes[idx].channel_backup_path = process.env.CHANNEL_BACKUP_PATH ? process.env.CHANNEL_BACKUP_PATH : (node.Settings.channelBackupPath) ? node.Settings.channelBackupPath : this.common.rtl_conf_file_path + sep + 'channels-backup' + sep + 'node-' + node.index;
        try {
          this.common.createDirectory(this.common.nodes[idx].channel_backup_path);
          const exists = fs.existsSync(this.common.nodes[idx].channel_backup_path + sep + 'channel-all.bak');
          if (!exists) {
            try {
              if (this.common.nodes[idx].ln_implementation === 'LND') {
                this.common.getAllNodeAllChannelBackup(this.common.nodes[idx]);
              } else {
                const createStream = fs.createWriteStream(this.common.nodes[idx].channel_backup_path + sep + 'channel-all.bak');
                createStream.end();
              }
            } catch (err) {
              this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating backup file: \n' + err });
            }
          }
        } catch (err) {
          this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating the backup directory: \n' + err });
        }
        this.common.nodes[idx].log_file = this.common.rtl_conf_file_path + '/logs/RTL-Node-' + node.index + '.log';
        this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'Config', msg: 'Node Config: ' + JSON.stringify(this.common.nodes[idx]) });
        const log_file = this.common.nodes[idx].log_file;
        if (fs.existsSync(log_file)) {
          fs.writeFile(log_file, '', () => { });
        } else {
          try {
            const directoryName = dirname(log_file);
            this.common.createDirectory(directoryName);
            const createStream = fs.createWriteStream(log_file);
            createStream.end();
          } catch (err) {
            this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating log file ' + log_file + ': \n' + err });
          }
        }
      });
    }
    this.setSSOParams(config);
    if (this.errMsg && this.errMsg.trim() !== '') { throw new Error(this.errMsg); }
  };

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
        this.common.readCookie();
      }
    }
  };

  private setSelectedNode = (config) => {
    if (config.defaultNodeIndex) {
      this.common.initSelectedNode = this.common.findNode(config.defaultNodeIndex);
    } else {
      this.common.initSelectedNode = this.common.findNode(this.common.nodes[0].index);
    }
  };

  public setServerConfiguration = () => {
    try {
      this.common.rtl_conf_file_path = (process.env.RTL_CONFIG_PATH) ? process.env.RTL_CONFIG_PATH : join(this.directoryName, '../..');
      const confFileFullPath = this.common.rtl_conf_file_path + sep + 'RTL-Config.json';
      if (!fs.existsSync(confFileFullPath)) {
        fs.writeFileSync(confFileFullPath, JSON.stringify(this.setDefaultConfig()));
      }
      const config = JSON.parse(fs.readFileSync(confFileFullPath, 'utf-8'));
      this.updateLogByLevel();
      this.validateNodeConfig(config);
      this.setSelectedNode(config);
    } catch (err) {
      this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while configuring the node server: \n' + err });
      throw new Error(err);
    }
  };

}

export const Config = new ConfigService();

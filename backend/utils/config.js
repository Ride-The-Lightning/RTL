import * as os from 'os';
import * as fs from 'fs';
import { join, dirname, sep } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import ini from 'ini';
import parseHocon from 'hocon-parser';
import { Common } from './common.js';
import { Logger } from './logger.js';
export class ConfigService {
    constructor() {
        this.platform = os.platform();
        this.hash = crypto.createHash('sha256');
        this.errMsg = '';
        this.directoryName = dirname(fileURLToPath(import.meta.url));
        this.common = Common;
        this.logger = Logger;
        this.setDefaultConfig = () => {
            const homeDir = os.userInfo().homedir;
            let macaroonPath = '';
            let configPath = '';
            let channelBackupPath = '';
            let dbPath = '';
            switch (this.platform) {
                case 'win32':
                    macaroonPath = homeDir + '\\AppData\\Local\\Lnd\\data\\chain\\bitcoin\\mainnet';
                    configPath = homeDir + '\\AppData\\Local\\Lnd\\lnd.conf';
                    channelBackupPath = homeDir + '\\backup\\node-1';
                    dbPath = homeDir + '\\database\\node-1';
                    break;
                case 'darwin':
                    macaroonPath = homeDir + '/Library/Application Support/Lnd/data/chain/bitcoin/mainnet';
                    configPath = homeDir + '/Library/Application Support/Lnd/lnd.conf';
                    channelBackupPath = homeDir + '/backup/node-1';
                    dbPath = homeDir + '/database/node-1';
                    break;
                case 'linux':
                    macaroonPath = homeDir + '/.lnd/data/chain/bitcoin/mainnet';
                    configPath = homeDir + '/.lnd/lnd.conf';
                    channelBackupPath = homeDir + '/backup/node-1';
                    dbPath = homeDir + '/database/node-1';
                    break;
                default:
                    macaroonPath = '';
                    configPath = '';
                    channelBackupPath = '';
                    dbPath = '';
                    break;
            }
            const configData = {
                port: '3000',
                defaultNodeIndex: 1,
                dbDirectoryPath: dbPath,
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
                            lnServerUrl: 'https://127.0.0.1:8080',
                            fiatConversion: false,
                            unannouncedChannels: false
                        }
                    }
                ]
            };
            if ((process?.env?.RTL_SSO && +process?.env?.RTL_SSO === 0) || configData.SSO.rtlSSO === 0) {
                configData['multiPass'] = 'password';
            }
            return configData;
        };
        this.normalizePort = (val) => {
            const port = parseInt(val, 10);
            if (isNaN(port)) {
                return val;
            }
            if (port >= 0) {
                return port;
            }
            return false;
        };
        this.updateLogByLevel = () => {
            let updateLogFlag = false;
            this.common.appConfig.rtlConfFilePath = process?.env?.RTL_CONFIG_PATH ? process?.env?.RTL_CONFIG_PATH : join(this.directoryName, '../..');
            try {
                const RTLConfFile = this.common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
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
            }
            catch (err) {
                this.errMsg = this.errMsg + '\nLog level update failed!';
            }
        };
        this.validateNodeConfig = (config) => {
            if ((process?.env?.RTL_SSO && +process?.env?.RTL_SSO === 0) || (typeof process?.env?.RTL_SSO === 'undefined' && +config.SSO.rtlSSO === 0)) {
                if (process?.env?.APP_PASSWORD && process?.env?.APP_PASSWORD.trim() !== '') {
                    this.common.appConfig.rtlPass = this.hash.update(process?.env?.APP_PASSWORD).digest('hex');
                    this.common.appConfig.allowPasswordUpdate = false;
                }
                else if (config.multiPassHashed && config.multiPassHashed !== '') {
                    this.common.appConfig.rtlPass = config.multiPassHashed;
                }
                else if (config.multiPass && config.multiPass !== '') {
                    this.common.appConfig.rtlPass = this.common.replacePasswordWithHash(this.hash.update(config.multiPass).digest('hex'));
                }
                else {
                    this.errMsg = this.errMsg + '\nNode Authentication can be set with multiPass only. Please set multiPass in RTL-Config.json';
                }
                this.common.appConfig.secret2FA = config.secret2FA;
                this.common.appConfig.enable2FA = !!config.secret2FA;
            }
            else {
                if (process?.env?.APP_PASSWORD && process?.env?.APP_PASSWORD.trim() !== '') {
                    this.errMsg = this.errMsg + '\nRTL Password cannot be set with SSO. Please set SSO as 0 or remove password.';
                }
            }
            this.common.port = (process?.env?.PORT) ? this.normalizePort(process?.env?.PORT) : (config.port) ? this.normalizePort(config.port) : 3000;
            this.common.host = (process?.env?.HOST) ? process?.env?.HOST : (config.host) ? config.host : null;
            this.common.appConfig.dbDirectoryPath = (process?.env?.DB_DIRECTORY_PATH) ? process?.env?.DB_DIRECTORY_PATH : (config.dbDirectoryPath) ? config.dbDirectoryPath : join(dirname(fileURLToPath(import.meta.url)), '..', '..');
            if (config.nodes && config.nodes.length > 0) {
                config.nodes.forEach((node, idx) => {
                    this.common.nodes[idx] = { Settings: {}, Authentication: {} };
                    this.common.nodes[idx].index = node.index;
                    this.common.nodes[idx].lnNode = node.lnNode;
                    this.common.nodes[idx].lnImplementation = (process?.env?.lnImplementation) ? process?.env?.lnImplementation : node.lnImplementation ? node.lnImplementation : 'LND';
                    if (this.common.nodes[idx].lnImplementation === 'CLT') {
                        this.common.nodes[idx].lnImplementation = 'CLN';
                    }
                    switch (this.common.nodes[idx].lnImplementation) {
                        case 'CLN':
                            if (process?.env?.RUNE_PATH && process?.env?.RUNE_PATH.trim() !== '') {
                                this.common.nodes[idx].Authentication.runePath = process?.env?.RUNE_PATH;
                            }
                            else if (node.Authentication && node.Authentication.runePath && node.Authentication.runePath.trim() !== '') {
                                this.common.nodes[idx].Authentication.runePath = node.Authentication.runePath;
                            }
                            else {
                                this.errMsg = 'Please set rune path for node index ' + node.index + ' in RTL-Config.json!';
                            }
                            break;
                        case 'ECL':
                            if (process?.env?.LN_API_PASSWORD) {
                                this.common.nodes[idx].Authentication.lnApiPassword = process?.env?.LN_API_PASSWORD;
                            }
                            else if (node.Authentication && node.Authentication.lnApiPassword) {
                                this.common.nodes[idx].Authentication.lnApiPassword = node.Authentication.lnApiPassword;
                            }
                            else {
                                this.common.nodes[idx].Authentication.lnApiPassword = '';
                            }
                            break;
                        default:
                            if (process?.env?.MACAROON_PATH && process?.env?.MACAROON_PATH.trim() !== '') {
                                this.common.nodes[idx].Authentication.macaroonPath = process?.env?.MACAROON_PATH;
                            }
                            else if (node.Authentication && node.Authentication.macaroonPath && node.Authentication.macaroonPath.trim() !== '') {
                                this.common.nodes[idx].Authentication.macaroonPath = node.Authentication.macaroonPath;
                            }
                            else {
                                this.errMsg = 'Please set macaroon path for node index ' + node.index + ' in RTL-Config.json!';
                            }
                            break;
                    }
                    if (process?.env?.CONFIG_PATH) {
                        this.common.nodes[idx].Authentication.configPath = process?.env?.CONFIG_PATH;
                    }
                    else if (node.Authentication && node.Authentication.configPath) {
                        this.common.nodes[idx].Authentication.configPath = node.Authentication.configPath;
                    }
                    else {
                        this.common.nodes[idx].Authentication.configPath = '';
                    }
                    if (this.common.nodes[idx].lnImplementation === 'ECL' && this.common.nodes[idx].Authentication.lnApiPassword === '' && this.common.nodes[idx].Authentication.configPath !== '') {
                        try {
                            const exists = fs.existsSync(this.common.nodes[idx].Authentication.configPath || '');
                            if (exists) {
                                try {
                                    const configFile = fs.readFileSync((this.common.nodes[idx].Authentication.configPath || ''), 'utf-8');
                                    const iniParsed = ini.parse(configFile);
                                    this.common.nodes[idx].Authentication.lnApiPassword = iniParsed['eclair.api.password'] ? iniParsed['eclair.api.password'] : parseHocon(configFile).eclair.api.password;
                                }
                                catch (err) {
                                    this.errMsg = this.errMsg + '\nSomething went wrong while reading config file: \n' + err;
                                }
                            }
                            else {
                                this.errMsg = this.errMsg + '\nInvalid config path: ' + this.common.nodes[idx].Authentication.configPath;
                            }
                        }
                        catch (err) {
                            this.errMsg = this.errMsg + '\nUnable to read config file: \n' + err;
                        }
                    }
                    if (this.common.nodes[idx].lnImplementation === 'ECL' && this.common.nodes[idx].Authentication.lnApiPassword === '') {
                        this.errMsg = this.errMsg + '\nPlease set config path Or api password for node index ' + node.index + ' in RTL-Config.json! It is mandatory for Eclair authentication!';
                    }
                    if (process?.env?.LN_SERVER_URL && process?.env?.LN_SERVER_URL.trim() !== '') {
                        this.common.nodes[idx].Settings.lnServerUrl = process?.env?.LN_SERVER_URL.endsWith('/v1') ? process?.env?.LN_SERVER_URL.slice(0, -3) : process?.env?.LN_SERVER_URL;
                    }
                    else if (process?.env?.LND_SERVER_URL && process?.env?.LND_SERVER_URL.trim() !== '') {
                        this.common.nodes[idx].Settings.lnServerUrl = process?.env?.LND_SERVER_URL.endsWith('/v1') ? process?.env?.LND_SERVER_URL.slice(0, -3) : process?.env?.LND_SERVER_URL;
                    }
                    else if (node.Settings.lnServerUrl && node.Settings.lnServerUrl.trim() !== '') {
                        this.common.nodes[idx].Settings.lnServerUrl = node.Settings.lnServerUrl.endsWith('/v1') ? node.Settings.lnServerUrl.slice(0, -3) : node.Settings.lnServerUrl;
                    }
                    else if (node.Settings.lndServerUrl && node.Settings.lndServerUrl.trim() !== '') {
                        this.common.nodes[idx].Settings.lnServerUrl = node.Settings.lndServerUrl.endsWith('/v1') ? node.Settings.lndServerUrl.slice(0, -3) : node.Settings.lndServerUrl;
                    }
                    else {
                        this.errMsg = this.errMsg + '\nPlease set LN Server URL for node index ' + node.index + ' in RTL-Config.json!';
                    }
                    this.common.nodes[idx].Settings.userPersona = node.Settings.userPersona ? node.Settings.userPersona : 'MERCHANT';
                    this.common.nodes[idx].Settings.themeMode = node.Settings.themeMode ? node.Settings.themeMode : 'DAY';
                    this.common.nodes[idx].Settings.themeColor = node.Settings.themeColor ? node.Settings.themeColor : 'PURPLE';
                    this.common.nodes[idx].Settings.unannouncedChannels = node.Settings.unannouncedChannels ? !!node.Settings.unannouncedChannels : false;
                    this.common.nodes[idx].Settings.logLevel = node.Settings.logLevel ? node.Settings.logLevel : 'ERROR';
                    this.common.nodes[idx].Settings.fiatConversion = node.Settings.fiatConversion ? !!node.Settings.fiatConversion : false;
                    if (this.common.nodes[idx].Settings.fiatConversion) {
                        this.common.nodes[idx].Settings.currencyUnit = node.Settings.currencyUnit ? node.Settings.currencyUnit : 'USD';
                    }
                    if (process?.env?.SWAP_SERVER_URL && process?.env?.SWAP_SERVER_URL.trim() !== '') {
                        this.common.nodes[idx].Settings.swapServerUrl = process?.env?.SWAP_SERVER_URL.endsWith('/v1') ? process?.env?.SWAP_SERVER_URL.slice(0, -3) : process?.env?.SWAP_SERVER_URL;
                        this.common.nodes[idx].Authentication.swapMacaroonPath = process?.env?.SWAP_MACAROON_PATH;
                    }
                    else if (node.Settings.swapServerUrl && node.Settings.swapServerUrl.trim() !== '') {
                        this.common.nodes[idx].Settings.swapServerUrl = node.Settings.swapServerUrl.endsWith('/v1') ? node.Settings.swapServerUrl.slice(0, -3) : node.Settings.swapServerUrl;
                        this.common.nodes[idx].Authentication.swapMacaroonPath = node.Authentication.swapMacaroonPath ? node.Authentication.swapMacaroonPath : '';
                    }
                    else {
                        this.common.nodes[idx].Settings.swapServerUrl = '';
                        this.common.nodes[idx].Authentication.swapMacaroonPath = '';
                    }
                    if (process?.env?.BOLTZ_SERVER_URL && process?.env?.BOLTZ_SERVER_URL.trim() !== '') {
                        this.common.nodes[idx].Settings.boltzServerUrl = process?.env?.BOLTZ_SERVER_URL.endsWith('/v1') ? process?.env?.BOLTZ_SERVER_URL.slice(0, -3) : process?.env?.BOLTZ_SERVER_URL;
                        this.common.nodes[idx].Authentication.boltzMacaroonPath = process?.env?.BOLTZ_MACAROON_PATH;
                    }
                    else if (node.Settings.boltzServerUrl && node.Settings.boltzServerUrl.trim() !== '') {
                        this.common.nodes[idx].Settings.boltzServerUrl = node.Settings.boltzServerUrl.endsWith('/v1') ? node.Settings.boltzServerUrl.slice(0, -3) : node.Settings.boltzServerUrl;
                        this.common.nodes[idx].Authentication.boltzMacaroonPath = node.Authentication.boltzMacaroonPath ? node.Authentication.boltzMacaroonPath : '';
                    }
                    else {
                        this.common.nodes[idx].Settings.boltzServerUrl = '';
                        this.common.nodes[idx].Authentication.boltzMacaroonPath = '';
                    }
                    this.common.nodes[idx].Settings.enableOffers = process?.env?.ENABLE_OFFERS ? process?.env?.ENABLE_OFFERS : (node.Settings.enableOffers) ? node.Settings.enableOffers : false;
                    this.common.nodes[idx].Settings.enablePeerswap = process?.env?.ENABLE_PEERSWAP ? process?.env?.ENABLE_PEERSWAP : (node.Settings.enablePeerswap) ? node.Settings.enablePeerswap : false;
                    this.common.nodes[idx].Settings.bitcoindConfigPath = process?.env?.BITCOIND_CONFIG_PATH ? process?.env?.BITCOIND_CONFIG_PATH : (node.Settings.bitcoindConfigPath) ? node.Settings.bitcoindConfigPath : '';
                    this.common.nodes[idx].Settings.channelBackupPath = process?.env?.CHANNEL_BACKUP_PATH ? process?.env?.CHANNEL_BACKUP_PATH : (node.Settings.channelBackupPath) ? node.Settings.channelBackupPath : this.common.appConfig.rtlConfFilePath + sep + 'channels-backup' + sep + 'node-' + node.index;
                    try {
                        this.common.createDirectory(this.common.nodes[idx].Settings.channelBackupPath);
                        const exists = fs.existsSync(this.common.nodes[idx].Settings.channelBackupPath + sep + 'channel-all.bak');
                        if (!exists) {
                            try {
                                if (this.common.nodes[idx].lnImplementation === 'LND') {
                                    this.common.getAllNodeAllChannelBackup(this.common.nodes[idx]);
                                }
                                else {
                                    const createStream = fs.createWriteStream(this.common.nodes[idx].Settings.channelBackupPath + sep + 'channel-all.bak');
                                    createStream.end();
                                }
                            }
                            catch (err) {
                                this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating backup file: \n' + err });
                            }
                        }
                    }
                    catch (err) {
                        this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating the backup directory: \n' + err });
                    }
                    this.common.nodes[idx].Settings.logFile = this.common.appConfig.rtlConfFilePath + '/logs/RTL-Node-' + node.index + '.log';
                    this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'Config', msg: 'Node Config: ' + JSON.stringify(this.common.nodes[idx]) });
                    const log_file = this.common.nodes[idx].Settings.logFile;
                    if (fs.existsSync(log_file || '')) {
                        fs.writeFile((log_file || ''), '', () => { });
                    }
                    else {
                        try {
                            const directoryName = dirname(log_file || '');
                            this.common.createDirectory(directoryName);
                            const createStream = fs.createWriteStream(log_file || '');
                            createStream.end();
                        }
                        catch (err) {
                            this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while creating log file ' + log_file + ': \n' + err });
                        }
                    }
                });
            }
            this.setSSOParams(config);
            if (this.errMsg && this.errMsg.trim() !== '') {
                throw new Error(this.errMsg);
            }
        };
        this.setSSOParams = (config) => {
            if (process?.env?.RTL_SSO) {
                this.common.appConfig.SSO.rtlSso = +process?.env?.RTL_SSO;
            }
            else if (config.SSO && config.SSO.rtlSSO) {
                this.common.appConfig.SSO.rtlSso = config.SSO.rtlSSO;
            }
            if (process?.env?.RTL_COOKIE_PATH) {
                this.common.appConfig.SSO.rtlCookiePath = process?.env?.RTL_COOKIE_PATH;
            }
            else if (config.SSO && config.SSO.rtlCookiePath) {
                this.common.appConfig.SSO.rtlCookiePath = config.SSO.rtlCookiePath;
            }
            else {
                this.common.appConfig.SSO.rtlCookiePath = '';
            }
            if (process?.env?.LOGOUT_REDIRECT_LINK) {
                this.common.appConfig.SSO.logoutRedirectLink = process?.env?.LOGOUT_REDIRECT_LINK;
            }
            else if (config.SSO && config.SSO.logoutRedirectLink) {
                this.common.appConfig.SSO.logoutRedirectLink = config.SSO.logoutRedirectLink;
            }
            if (+this.common.appConfig.SSO.rtlSso) {
                if (!this.common.appConfig.SSO.rtlCookiePath || this.common.appConfig.SSO.rtlCookiePath.trim() === '') {
                    this.errMsg = 'Please set rtlCookiePath value for single sign on option!';
                }
                else {
                    this.common.readCookie();
                }
            }
        };
        this.setSelectedNode = (config) => {
            if (config.defaultNodeIndex) {
                this.common.selectedNode = this.common.findNode(config.defaultNodeIndex) || {};
            }
            else {
                this.common.selectedNode = this.common.findNode(this.common.nodes[0].index) || {};
            }
        };
        this.setServerConfiguration = () => {
            try {
                this.common.appConfig.rtlConfFilePath = (process?.env?.RTL_CONFIG_PATH) ? process?.env?.RTL_CONFIG_PATH : join(this.directoryName, '../..');
                const confFileFullPath = this.common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
                if (!fs.existsSync(confFileFullPath)) {
                    fs.writeFileSync(confFileFullPath, JSON.stringify(this.setDefaultConfig()));
                }
                const config = JSON.parse(fs.readFileSync(confFileFullPath, 'utf-8'));
                this.updateLogByLevel();
                this.validateNodeConfig(config);
                this.setSelectedNode(config);
            }
            catch (err) {
                this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'Config', msg: 'Something went wrong while configuring the node server: \n' + err });
                throw new Error(err);
            }
        };
        this.setServerConfiguration();
    }
}
export const Config = new ConfigService();

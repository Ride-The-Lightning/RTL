import * as fs from 'fs';
import { join, dirname, isAbsolute, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import request from 'request-promise';
import { Logger } from './logger.js';
export class CommonService {
    constructor() {
        this.logger = Logger;
        this.nodes = [];
        this.selectedNode = null;
        this.ssoInit = { rtlSso: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' };
        this.appConfig = { defaultNodeIndex: 0, selectedNodeIndex: 0, rtlConfFilePath: '', dbDirectoryPath: join(dirname(fileURLToPath(import.meta.url)), '..', '..'), rtlPass: '', allowPasswordUpdate: true, enable2FA: false, secret2FA: '', SSO: this.ssoInit, nodes: [] };
        this.port = 3000;
        this.host = '';
        this.secret_key = crypto.randomBytes(64).toString('hex');
        this.read_dummy_data = false;
        this.baseHref = '/rtl';
        this.dummy_data_array_from_file = [];
        this.MONTHS = [
            { name: 'JAN', days: 31 }, { name: 'FEB', days: 28 }, { name: 'MAR', days: 31 }, { name: 'APR', days: 30 }, { name: 'MAY', days: 31 }, { name: 'JUN', days: 30 },
            { name: 'JUL', days: 31 }, { name: 'AUG', days: 31 }, { name: 'SEP', days: 30 }, { name: 'OCT', days: 31 }, { name: 'NOV', days: 30 }, { name: 'DEC', days: 31 }
        ];
        this.maskPasswords = (obj) => {
            const keys = Object.keys(obj);
            const length = keys.length;
            if (length !== 0) {
                for (let i = 0; i < length; i++) {
                    if (typeof obj[keys[i]] === 'object') {
                        keys[keys[i]] = this.maskPasswords(obj[keys[i]]);
                    }
                    if (typeof keys[i] === 'string' &&
                        ((keys[i].toLowerCase().includes('password') && keys[i] !== 'allowPasswordUpdate') || keys[i].toLowerCase().includes('multipass') ||
                            keys[i].toLowerCase().includes('rpcpass') || keys[i].toLowerCase().includes('rpcpassword') ||
                            keys[i].toLowerCase().includes('rpcuser'))) {
                        obj[keys[i]] = '*'.repeat(20);
                    }
                }
            }
            return obj;
        };
        this.removeAuthSecureData = (node) => {
            delete node.authentication.macaroonPath;
            delete node.authentication.runePath;
            delete node.authentication.runeValue;
            delete node.authentication.lnApiPassword;
            delete node.authentication.options;
            return node;
        };
        this.removeSecureData = (config) => {
            delete config.rtlConfFilePath;
            delete config.rtlPass;
            delete config.multiPass;
            delete config.multiPassHashed;
            delete config.secret2FA;
            config.nodes?.map((node) => this.removeAuthSecureData(node));
            return config;
        };
        this.addSecureData = (config) => {
            config.rtlConfFilePath = this.appConfig.rtlConfFilePath;
            config.rtlPass = this.appConfig.rtlPass;
            config.multiPassHashed = this.appConfig.multiPassHashed;
            config.SSO.rtlCookiePath = this.appConfig.SSO.rtlCookiePath;
            if (this.appConfig.multiPass) {
                config.multiPass = this.appConfig.multiPass;
            }
            if (config.secret2FA === this.appConfig.secret2FA) {
                config.secret2FA = this.appConfig.secret2FA;
            }
            config.nodes.map((node, i) => {
                if (this.appConfig && this.appConfig.nodes && this.appConfig.nodes.length > i && this.appConfig.nodes[i].authentication) {
                    if (this.appConfig.nodes[i].authentication.macaroonPath) {
                        node.authentication.macaroonPath = this.appConfig.nodes[i].authentication.macaroonPath;
                    }
                    if (this.appConfig.nodes[i].authentication.runePath) {
                        node.authentication.runePath = this.appConfig.nodes[i].authentication.runePath;
                    }
                    if (this.appConfig.nodes[i].authentication.lnApiPassword) {
                        node.authentication.lnApiPassword = this.appConfig.nodes[i].authentication.lnApiPassword;
                    }
                }
                return node;
            });
            return config;
        };
        this.setSwapServerOptions = (req) => {
            const swapOptions = {
                baseUrl: req.session.selectedNode.settings.swapServerUrl,
                uri: '',
                rejectUnauthorized: false,
                json: true,
                headers: { 'Grpc-Metadata-macaroon': '' }
            };
            if (req.session.selectedNode.authentication.swapMacaroonPath) {
                try {
                    swapOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.authentication.swapMacaroonPath, 'loop.macaroon')).toString('hex') };
                }
                catch (err) {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Loop macaroon Error', error: err });
                }
            }
            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Swap Options', data: swapOptions });
            return swapOptions;
        };
        this.getBoltzServerOptions = (req) => {
            const boltzOptions = {
                url: req.session.selectedNode.settings.boltzServerUrl,
                rejectUnauthorized: false,
                json: true,
                headers: { 'Grpc-Metadata-macaroon': '' }
            };
            if (req.session.selectedNode.authentication.boltzMacaroonPath) {
                try {
                    boltzOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.authentication.boltzMacaroonPath, 'admin.macaroon')).toString('hex') };
                }
                catch (err) {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Boltz macaroon Error', error: err });
                }
            }
            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Boltz Options', data: boltzOptions });
            return boltzOptions;
        };
        this.getOptions = (req) => {
            if (req.session.selectedNode && req.session.selectedNode.authentication.options) {
                req.session.selectedNode.authentication.options.method = (req.session.selectedNode.lnImplementation && req.session.selectedNode.lnImplementation.toUpperCase() === 'LND') ? 'GET' : 'POST';
                delete req.session.selectedNode.authentication.options.form;
                delete req.session.selectedNode.authentication.options.body;
                req.session.selectedNode.authentication.options.qs = {};
                return req.session.selectedNode.authentication.options;
            }
            return this.handleError({ statusCode: 401, message: 'Session expired after a day\'s inactivity' }, 'Session Expired', 'Session Expiry Error', this.selectedNode);
        };
        this.updateSelectedNodeOptions = (req) => {
            if (!req.session.selectedNode) {
                req.session.selectedNode = {};
            }
            req.session.selectedNode.authentication.options = {
                url: '',
                rejectUnauthorized: false,
                json: true,
                form: null
            };
            try {
                if (req.session.selectedNode && req.session.selectedNode.lnImplementation) {
                    switch (req.session.selectedNode.lnImplementation.toUpperCase()) {
                        case 'CLN':
                            try {
                                if (!req.session.selectedNode.authentication.runeValue) {
                                    req.session.selectedNode.authentication.runeValue = this.getRuneValue(req.session.selectedNode.authentication.runePath);
                                }
                                req.session.selectedNode.authentication.options.headers = { rune: req.session.selectedNode.authentication.runeValue };
                            }
                            catch (err) {
                                throw new Error(err);
                            }
                            break;
                        case 'ECL':
                            req.session.selectedNode.authentication.options.headers = { authorization: 'Basic ' + Buffer.from(':' + req.session.selectedNode.authentication.lnApiPassword).toString('base64') };
                            break;
                        default:
                            req.session.selectedNode.authentication.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.authentication.macaroonPath, 'admin.macaroon')).toString('hex') };
                            break;
                    }
                }
                if (req.session.selectedNode) {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Updated Node Options for ' + req.session.selectedNode.lnNode, data: req.session.selectedNode.authentication.options });
                }
                return { status: 200, message: 'Updated Successfully' };
            }
            catch (err) {
                req.session.selectedNode.authentication.options = {
                    url: '',
                    rejectUnauthorized: false,
                    json: true,
                    form: null
                };
                this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Update Selected Node Options Error', error: err });
                return { status: 502, message: err };
            }
        };
        this.getRuneValue = (rune_path) => {
            const data = fs.readFileSync(rune_path, 'utf8');
            const pattern = /LIGHTNING_RUNE="(?<runeValue>[^"]+)"/;
            const match = data.match(pattern);
            if (match.groups.runeValue) {
                return match.groups.runeValue;
            }
            else {
                throw new Error('Rune not found in the file.');
            }
        };
        this.setOptions = (req) => {
            if (this.nodes[0].authentication.options && this.nodes[0].authentication.options.headers) {
                return;
            }
            if (this.nodes && this.nodes.length > 0) {
                this.nodes.forEach((node) => {
                    node.authentication.options = {
                        url: '',
                        rejectUnauthorized: false,
                        json: true,
                        form: null
                    };
                    try {
                        if (node.lnImplementation) {
                            switch (node.lnImplementation.toUpperCase()) {
                                case 'CLN':
                                    try {
                                        if (!node.authentication.runeValue) {
                                            node.authentication.runeValue = this.getRuneValue(node.authentication.runePath);
                                        }
                                        node.authentication.options.headers = { rune: node.authentication.runeValue };
                                    }
                                    catch (err) {
                                        throw new Error(err);
                                    }
                                    break;
                                case 'ECL':
                                    node.authentication.options.headers = { authorization: 'Basic ' + Buffer.from(':' + node.authentication.lnApiPassword).toString('base64') };
                                    break;
                                default:
                                    node.authentication.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(node.authentication.macaroonPath, 'admin.macaroon')).toString('hex') };
                                    break;
                            }
                        }
                    }
                    catch (err) {
                        this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Common Set Options Error', error: err });
                        node.authentication.options = {
                            url: '',
                            rejectUnauthorized: false,
                            json: true,
                            form: ''
                        };
                    }
                    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Set Node Options for ' + node.lnNode, data: node.authentication.options });
                });
                this.updateSelectedNodeOptions(req);
            }
        };
        this.findNode = (selNodeIndex) => this.nodes.find((node) => node.index === selNodeIndex);
        this.replaceNode = (req, newNode) => {
            const foundIndex = this.nodes.findIndex((node) => node.index === req.session.selectedNode.index);
            this.nodes.splice(foundIndex, 1, newNode);
            req.session.selectedNode = this.findNode(req.session.selectedNode.index);
        };
        this.convertTimeToEpoch = (timeToConvert) => Math.floor(timeToConvert.getTime() / 1000);
        this.convertTimestampToTime = (num) => {
            const myDate = new Date(+num * 1000);
            let days = myDate.getDate().toString();
            days = +days < 10 ? '0' + days : days;
            let hours = myDate.getHours().toString();
            hours = +hours < 10 ? '0' + hours : hours;
            let minutes = myDate.getMinutes().toString();
            minutes = +minutes < 10 ? '0' + minutes : minutes;
            let seconds = myDate.getSeconds().toString();
            seconds = +seconds < 10 ? '0' + seconds : seconds;
            return days + '/' + this.MONTHS[myDate.getMonth()].name + '/' + myDate.getFullYear() + ' ' + hours + ':' + minutes + ':' + seconds;
        };
        this.sortAscByKey = (array, key) => array.sort((a, b) => {
            const x = +a[key];
            const y = +b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
        this.sortAscByStrKey = (array, key) => array.sort((a, b) => {
            const x = a[key] ? a[key].toUpperCase() : '';
            const y = b[key] ? b[key].toUpperCase() : '';
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
        this.sortDescByKey = (array, key) => {
            const temp = array.sort((a, b) => {
                const x = +a[key] ? +a[key] : 0;
                const y = +b[key] ? +b[key] : 0;
                return (x > y) ? -1 : ((x < y) ? 1 : 0);
            });
            return temp;
        };
        this.sortDescByStrKey = (array, key) => {
            const temp = array.sort((a, b) => {
                const x = a[key] ? a[key].toUpperCase() : '';
                const y = b[key] ? b[key].toUpperCase() : '';
                return (x > y) ? -1 : ((x < y) ? 1 : 0);
            });
            return temp;
        };
        this.newestOnTop = (array, key, value) => {
            const newlyAddedRecord = array.splice(array.findIndex((item) => item[key] === value), 1);
            array?.unshift(newlyAddedRecord[0]);
            return array;
        };
        this.camelCase = (str) => str?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()))?.replace(/\s+/g, '')?.replace(/-/g, ' ');
        this.titleCase = (str) => {
            if (str.indexOf('!\n') > 0 || str.indexOf('.\n') > 0) {
                return str.split('\n')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + '\n', '');
            }
            else {
                if (str.indexOf(' ') > 0) {
                    return str.split(' ')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + ' ', '');
                }
                else {
                    return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
                }
            }
        };
        this.handleError = (errRes, fileName, errMsg, selectedNode) => {
            const err = JSON.parse(JSON.stringify(errRes));
            if (!selectedNode) {
                selectedNode = this.selectedNode;
            }
            switch (selectedNode.lnImplementation) {
                case 'LND':
                    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
                        delete err.options.headers['Grpc-Metadata-macaroon'];
                    }
                    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
                        delete err.response.request.headers['Grpc-Metadata-macaroon'];
                    }
                    break;
                case 'CLN':
                    if (err.options && err.options.headers && err.options.headers.rune) {
                        delete err.options.headers.rune;
                    }
                    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.rune) {
                        delete err.response.request.headers.rune;
                    }
                    break;
                case 'ECL':
                    if (err.options && err.options.headers && err.options.headers.authorization) {
                        delete err.options.headers.authorization;
                    }
                    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
                        delete err.response.request.headers.authorization;
                    }
                    break;
                default:
                    if (err.options && err.options.headers) {
                        delete err.options.headers;
                    }
                    break;
            }
            this.logger.log({ selectedNode: selectedNode, level: 'ERROR', fileName: fileName, msg: errMsg, error: (typeof err === 'object' ? JSON.stringify(err) : err) });
            let newErrorObj = { statusCode: 500, message: '', error: '' };
            if (err.code && err.code === 'ENOENT') {
                newErrorObj = {
                    statusCode: 500,
                    message: 'No such file or directory ' + (err.path ? err.path : ''),
                    error: 'No such file or directory ' + (err.path ? err.path : '')
                };
            }
            else {
                newErrorObj = {
                    statusCode: err.statusCode ? err.statusCode : err.status ? err.status : (err.error && err.error.code && err.error.code === 'ECONNREFUSED') ? 503 : 500,
                    message: (err.error && err.error.message) ? err.error.message : err.message ? err.message : errMsg,
                    error: ((err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
                        (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
                            (err.error && err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message :
                                (err.error && err.error.message && typeof err.error.message === 'string') ? err.error.message :
                                    (err.error && typeof err.error === 'string') ? err.error :
                                        (err.message && typeof err.message === 'string') ? err.message : (typeof err === 'string') ? err : 'Unknown Error')
                };
            }
            if (selectedNode.lnImplementation === 'ECL' && err.message && err.message.indexOf('Authentication Error') < 0 && err.name && err.name === 'StatusCodeError') {
                newErrorObj.statusCode = 500;
            }
            return newErrorObj;
        };
        this.getRequestIP = (req) => ((typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) ||
            req.ip ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            (req.connection.socket ? req.connection.socket.remoteAddress : null));
        this.getDummyData = (dataKey, lnImplementation) => {
            const dummyDataFile = this.appConfig.rtlConfFilePath + sep + 'ECLDummyData.log';
            return new Promise((resolve, reject) => {
                if (this.dummy_data_array_from_file.length === 0) {
                    fs.readFile(dummyDataFile, 'utf8', (err, data) => {
                        if (err) {
                            if (err.code === 'ENOENT') {
                                this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Dummy data file does not exist' });
                            }
                            else {
                                this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Getting dummy data failed' });
                            }
                        }
                        else {
                            this.dummy_data_array_from_file = data.split('\n');
                            resolve(this.filterData(dataKey, lnImplementation));
                        }
                    });
                }
                else {
                    resolve(this.filterData(dataKey, lnImplementation));
                }
            });
        };
        this.readCookie = () => {
            const exists = fs.existsSync(this.appConfig.SSO.rtlCookiePath);
            if (exists) {
                try {
                    this.appConfig.SSO.cookieValue = fs.readFileSync(this.appConfig.SSO.rtlCookiePath, 'utf-8');
                }
                catch (err) {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while reading cookie: \n' + err });
                    throw new Error(err);
                }
            }
            else {
                try {
                    const directoryName = dirname(this.appConfig.SSO.rtlCookiePath);
                    this.createDirectory(directoryName);
                    fs.writeFileSync(this.appConfig.SSO.rtlCookiePath, crypto.randomBytes(64).toString('hex'));
                    this.appConfig.SSO.cookieValue = fs.readFileSync(this.appConfig.SSO.rtlCookiePath, 'utf-8');
                }
                catch (err) {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while reading the cookie: \n' + err });
                    throw new Error(err);
                }
            }
        };
        this.refreshCookie = () => {
            try {
                fs.writeFileSync(this.appConfig.SSO.rtlCookiePath, crypto.randomBytes(64).toString('hex'));
                this.appConfig.SSO.cookieValue = fs.readFileSync(this.appConfig.SSO.rtlCookiePath, 'utf-8');
            }
            catch (err) {
                this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while refreshing cookie', error: err });
                throw new Error(err);
            }
        };
        this.createDirectory = (directoryName) => {
            const initDir = isAbsolute(directoryName) ? sep : '';
            directoryName.split(sep)?.reduce((parentDir, childDir) => {
                const curDir = resolve(parentDir, childDir);
                try {
                    if (!fs.existsSync(curDir)) {
                        fs.mkdirSync(curDir);
                    }
                }
                catch (err) {
                    if (err.code !== 'EEXIST') {
                        if (err.code === 'ENOENT') {
                            throw new Error(`ENOENT: No such file or directory, mkdir '${directoryName}'. Ensure that the path separator is '${sep}'`);
                        }
                        else {
                            throw err;
                        }
                    }
                }
                return curDir;
            }, initDir);
        };
        this.replacePasswordWithHash = (multiPassHashed) => {
            this.appConfig.rtlConfFilePath = process.env.RTL_CONFIG_PATH ? process.env.RTL_CONFIG_PATH : join(dirname(fileURLToPath(import.meta.url)), '../..');
            try {
                const RTLConfFile = this.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
                const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
                config.multiPassHashed = multiPassHashed;
                delete config.multiPass;
                fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
                this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Please note that, RTL has encrypted the plaintext password into its corresponding hash' });
                return config.multiPassHashed;
            }
            catch (err) {
                this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Password hashing failed', error: err });
            }
        };
        this.getAllNodeAllChannelBackup = (node) => {
            const channel_backup_file = node.settings.channelBackupPath + sep + 'channel-all.bak';
            const options = {
                url: node.settings.lnServerUrl + '/v1/channels/backup',
                rejectUnauthorized: false,
                json: true,
                headers: { 'Grpc-Metadata-macaroon': fs.readFileSync(node.authentication.macaroonPath + '/admin.macaroon').toString('hex') }
            };
            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Getting Channel Backup for Node ' + node.lnNode + '..' });
            request(options).then((body) => {
                fs.writeFile(channel_backup_file, JSON.stringify(body), (err) => {
                    if (err) {
                        if (node.lnNode) {
                            this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for Node ' + node.lnNode, error: err });
                        }
                        else {
                            this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for File ' + channel_backup_file, error: err });
                        }
                    }
                    else {
                        if (node.lnNode) {
                            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Successful in Channel Backup for Node ' + node.lnNode, data: body });
                        }
                        else {
                            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Successful in Channel Backup for File ' + channel_backup_file, data: body });
                        }
                    }
                });
            }, (err) => {
                this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for Node ' + node.lnNode, error: err });
                fs.writeFile(channel_backup_file, '', () => { });
            });
        };
        this.isVersionCompatible = (currentVersion, checkVersion) => {
            if (currentVersion && currentVersion !== '') {
                // eslint-disable-next-line prefer-named-capture-group
                const pattern = /v?(\d+(\.\d+)*)/;
                const match = currentVersion.match(pattern);
                if (match && match.length && match.length > 1) {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Global Version ' + match[1] });
                    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Checking Compatiblility with Version ' + checkVersion });
                    const currentVersionArr = match[1].split('.') || [];
                    currentVersionArr[1] = currentVersionArr[1].substring(0, 2);
                    const checkVersionsArr = checkVersion.split('.');
                    checkVersionsArr[1] = checkVersionsArr[1].substring(0, 2);
                    return (+currentVersionArr[0] > +checkVersionsArr[0]) ||
                        (+currentVersionArr[0] === +checkVersionsArr[0] && +currentVersionArr[1] > +checkVersionsArr[1]) ||
                        (+currentVersionArr[0] === +checkVersionsArr[0] && +currentVersionArr[1] === +checkVersionsArr[1] && +currentVersionArr[2] >= +checkVersionsArr[2]);
                }
                else {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Invalid Version String ' + currentVersion });
                    return false;
                }
            }
            return false;
        };
        this.getMonthDays = (selMonth, selYear) => ((selMonth === 1 && selYear % 4 === 0) ? (this.MONTHS[selMonth].days + 1) : this.MONTHS[selMonth].days);
        this.logEnvVariables = (req) => {
            const selNode = req.session.selectedNode;
            if (selNode && selNode.index) {
                this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup:', msg: JSON.stringify(this.removeSecureData(JSON.parse(JSON.stringify(this.appConfig)))) });
                this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'SSO: ' + this.appConfig.SSO.rtlSso });
            }
        };
        this.filterData = (dataKey, lnImplementation) => {
            let search_string = '';
            if (lnImplementation === 'ECL') {
                switch (dataKey) {
                    case 'GetInfo':
                        search_string = 'INFO: GetInfo => Get Info Response: ';
                        break;
                    case 'Fees':
                        search_string = 'INFO: Fees => Fee Response: ';
                        break;
                    case 'Payments':
                        search_string = 'INFO: Fees => Payments Response: ';
                        break;
                    case 'Invoices':
                        search_string = 'INFO: Invoice => Invoices List Received: ';
                        break;
                    case 'OnChainBalance':
                        search_string = 'INFO: Onchain => Balance Received: ';
                        break;
                    case 'Peers':
                        search_string = 'INFO: Peers => Peers with Alias: ';
                        break;
                    case 'Channels':
                        search_string = 'INFO: Channels => Simplified Channels with Alias: ';
                        break;
                    default:
                        search_string = 'Random Line';
                        break;
                }
            }
            else if (lnImplementation === 'CLN') {
                switch (dataKey) {
                    case 'GetInfo':
                        search_string = 'DEBUG: GetInfo => Node Information. ';
                        break;
                    case 'Fees':
                        search_string = 'DEBUG: Fees => Fee Received. ';
                        break;
                    case 'Payments':
                        search_string = 'DEBUG: Payments => Payment List Received: ';
                        break;
                    case 'Invoices':
                        search_string = 'DEBUG: Invoice => Invoices List Received. ';
                        break;
                    case 'ChannelBalance':
                        search_string = 'DEBUG: Channels => Local Remote Balance. ';
                        break;
                    case 'Peers':
                        search_string = 'DEBUG: Peers => Peers with Alias: ';
                        break;
                    case 'Channels':
                        search_string = 'DEBUG: Channels => List Channels: ';
                        break;
                    case 'Balance':
                        search_string = 'DEBUG: Balance => Balance Received. ';
                        break;
                    case 'ForwardingHistory':
                        search_string = 'DEBUG: Channels => Forwarding History Received: ';
                        break;
                    case 'UTXOs':
                        search_string = 'DEBUG: OnChain => List Funds Received. ';
                        break;
                    case 'FeeRateperkb':
                        search_string = 'DEBUG: Network => Network Fee Rates Received for perkb. ';
                        break;
                    case 'FeeRateperkw':
                        search_string = 'DEBUG: Network => Network Fee Rates Received for perkw. ';
                        break;
                    default:
                        search_string = 'Random Line';
                        break;
                }
            }
            const foundDataLine = this.dummy_data_array_from_file.find((dataItem) => dataItem.includes(search_string));
            const dataStr = foundDataLine ? foundDataLine.substring((foundDataLine.indexOf(search_string)) + search_string.length) : '{}';
            return JSON.parse(dataStr);
        };
    }
}
export const Common = new CommonService();

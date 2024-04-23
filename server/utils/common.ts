import * as fs from 'fs';
import { join, dirname, isAbsolute, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import request from 'request-promise';
import { Logger, LoggerService } from './logger.js';
import { ApplicationConfig, SelectedNode } from '../models/config.model.js';

export class CommonService {

  public logger: LoggerService = Logger;
  public nodes: SelectedNode[] = [];
  public selectedNode: SelectedNode = null;
  public ssoInit = { rtlSso: 0, rtlCookiePath: '', logoutRedirectLink: '', cookieValue: '' };
  public appConfig: ApplicationConfig = { defaultNodeIndex: 0, selectedNodeIndex: 0, rtlConfFilePath: '', dbDirectoryPath: join(dirname(fileURLToPath(import.meta.url)), '..', '..'), rtlPass: '', allowPasswordUpdate: true, enable2FA: false, secret2FA: '', SSO: this.ssoInit, nodes: [] };
  public port = 3000;
  public host = '';
  public secret_key = crypto.randomBytes(64).toString('hex');
  public read_dummy_data = false;
  public baseHref = '/rtl';
  private dummy_data_array_from_file = [];
  private MONTHS = [
    { name: 'JAN', days: 31 }, { name: 'FEB', days: 28 }, { name: 'MAR', days: 31 }, { name: 'APR', days: 30 }, { name: 'MAY', days: 31 }, { name: 'JUN', days: 30 },
    { name: 'JUL', days: 31 }, { name: 'AUG', days: 31 }, { name: 'SEP', days: 30 }, { name: 'OCT', days: 31 }, { name: 'NOV', days: 30 }, { name: 'DEC', days: 31 }
  ];

  constructor() {}

  public setSwapServerOptions = (req) => {
    const swapOptions = {
      baseUrl: req.session.selectedNode.Settings.swapServerUrl,
      uri: '',
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': '' }
    };
    if (req.session.selectedNode.Authentication.swapMacaroonPath) {
      try {
        swapOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.Authentication.swapMacaroonPath, 'loop.macaroon')).toString('hex') };
      } catch (err) {
        this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Loop macaroon Error', error: err });
      }
    }
    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Swap Options', data: swapOptions });
    return swapOptions;
  };

  public getBoltzServerOptions = (req) => {
    const boltzOptions = {
      url: req.session.selectedNode.Settings.boltzServerUrl,
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': '' }
    };
    if (req.session.selectedNode.Authentication.boltzMacaroonPath) {
      try {
        boltzOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.Authentication.boltzMacaroonPath, 'admin.macaroon')).toString('hex') };
      } catch (err) {
        this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Boltz macaroon Error', error: err });
      }
    }
    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Boltz Options', data: boltzOptions });
    return boltzOptions;
  };

  public getOptions = (req) => {
    if (req.session.selectedNode && req.session.selectedNode.Authentication.options) {
      req.session.selectedNode.Authentication.options.method = (req.session.selectedNode.lnImplementation && req.session.selectedNode.lnImplementation.toUpperCase() === 'LND') ? 'GET' : 'POST';
      delete req.session.selectedNode.Authentication.options.form;
      delete req.session.selectedNode.Authentication.options.body;
      req.session.selectedNode.Authentication.options.qs = {};
      return req.session.selectedNode.Authentication.options;
    }
    return this.handleError({ statusCode: 401, message: 'Session expired after a day\'s inactivity' }, 'Session Expired', 'Session Expiry Error', this.selectedNode);
  };

  public updateSelectedNodeOptions = (req) => {
    if (!req.session.selectedNode) {
      req.session.selectedNode = {};
    }
    req.session.selectedNode.Authentication.options = {
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
              if (!req.session.selectedNode.Authentication.runeValue) {
                req.session.selectedNode.Authentication.runeValue = this.getRuneValue(req.session.selectedNode.Authentication.runePath);
              }
              req.session.selectedNode.Authentication.options.headers = { rune: req.session.selectedNode.Authentication.runeValue };
            } catch (err) {
              throw new Error(err);
            }
            break;

          case 'ECL':
            req.session.selectedNode.Authentication.options.headers = { authorization: 'Basic ' + Buffer.from(':' + req.session.selectedNode.Authentication.lnApiPassword).toString('base64') };
            break;

          default:
            req.session.selectedNode.Authentication.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.Authentication.macaroonPath, 'admin.macaroon')).toString('hex') };
            break;
        }
      }
      if (req.session.selectedNode) {
        this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Updated Node Options for ' + req.session.selectedNode.lnNode, data: req.session.selectedNode.Authentication.options });
      }
      return { status: 200, message: 'Updated Successfully' };
    } catch (err) {
      req.session.selectedNode.Authentication.options = {
        url: '',
        rejectUnauthorized: false,
        json: true,
        form: null
      };
      this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Update Selected Node Options Error', error: err });
      return { status: 502, message: err };
    }
  };

  public getRuneValue = (rune_path) => {
    const data = fs.readFileSync(rune_path, 'utf8');
    const pattern = /LIGHTNING_RUNE="(?<runeValue>[^"]+)"/;
    const match = data.match(pattern);
    if (match.groups.runeValue) {
      return match.groups.runeValue;
    } else {
      throw new Error('Rune not found in the file.');
    }
  };

  public setOptions = (req) => {
    if (this.nodes[0].Authentication.options && this.nodes[0].Authentication.options.headers) { return; }
    if (this.nodes && this.nodes.length > 0) {
      this.nodes.forEach((node) => {
        node.Authentication.options = {
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
                  if (!node.Authentication.runeValue) {
                    node.Authentication.runeValue = this.getRuneValue(node.Authentication.runePath);
                  }
                  node.Authentication.options.headers = { rune: node.Authentication.runeValue };
                } catch (err) {
                  throw new Error(err);
                }
                break;

              case 'ECL':
                node.Authentication.options.headers = { authorization: 'Basic ' + Buffer.from(':' + node.Authentication.lnApiPassword).toString('base64') };
                break;

              default:
                node.Authentication.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(node.Authentication.macaroonPath, 'admin.macaroon')).toString('hex') };
                break;
            }
          }
        } catch (err) {
          this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Common Set Options Error', error: err });
          node.Authentication.options = {
            url: '',
            rejectUnauthorized: false,
            json: true,
            form: ''
          };
        }
        this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Set Node Options for ' + node.lnNode, data: node.Authentication.options });
      });
      this.updateSelectedNodeOptions(req);
    }
  };

  public findNode = (selNodeIndex) => this.nodes.find((node) => node.index === selNodeIndex);

  public replaceNode = (req, newNode) => {
    const foundIndex = this.nodes.findIndex((node) => node.index === req.session.selectedNode.index);
    this.nodes.splice(foundIndex, 1, newNode);
    req.session.selectedNode = this.findNode(req.session.selectedNode.index);
  };

  public convertTimeToEpoch = (timeToConvert: Date) => Math.floor(timeToConvert.getTime() / 1000);

  public convertTimestampToTime = (num) => {
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

  public sortAscByKey = (array, key) => array.sort((a, b) => {
    const x = +a[key];
    const y = +b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });

  public sortAscByStrKey = (array, key) => array.sort((a, b) => {
    const x = a[key] ? a[key].toUpperCase() : '';
    const y = b[key] ? b[key].toUpperCase() : '';
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });

  public sortDescByKey = (array, key) => {
    const temp = array.sort((a, b) => {
      const x = +a[key] ? +a[key] : 0;
      const y = +b[key] ? +b[key] : 0;
      return (x > y) ? -1 : ((x < y) ? 1 : 0);
    });
    return temp;
  };

  public sortDescByStrKey = (array, key) => {
    const temp = array.sort((a, b) => {
      const x = a[key] ? a[key].toUpperCase() : '';
      const y = b[key] ? b[key].toUpperCase() : '';
      return (x > y) ? -1 : ((x < y) ? 1 : 0);
    });
    return temp;
  };

  public newestOnTop = (array, key, value) => {
    const newlyAddedRecord = array.splice(array.findIndex((item) => item[key] === value), 1);
    array?.unshift(newlyAddedRecord[0]);
    return array;
  };

  public camelCase = (str: string) => str?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()))?.replace(/\s+/g, '')?.replace(/-/g, ' ');

  public titleCase = (str: string) => {
    if (str.indexOf('!\n') > 0 || str.indexOf('.\n') > 0) {
      return str.split('\n')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + '\n', '');
    } else {
      if (str.indexOf(' ') > 0) {
        return str.split(' ')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + ' ', '');
      } else {
        return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
      }
    }
  };

  public handleError = (errRes, fileName, errMsg, selectedNode: SelectedNode) => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err && err.error && Object.keys(err.error).length === 0 && errRes.error && (errRes.error.stack || errRes.error.message)) {
      errRes.error = errRes.error.stack || errRes.error.message;
      err = JSON.parse(JSON.stringify(errRes));
    } else if (errRes.message || errRes.stack) {
      errRes.error = errRes.message || errRes.stack;
      err = JSON.parse(JSON.stringify(errRes));
    }
    if (!selectedNode) { selectedNode = this.selectedNode; }
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
        if (err.options && err.options.headers && err.options.headers.macaroon) {
          delete err.options.headers.macaroon;
        }
        if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
          delete err.response.request.headers.macaroon;
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
        if (err.options && err.options.headers) { delete err.options.headers; }
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
    } else {
      newErrorObj = {
        statusCode: err.statusCode ? err.statusCode : err.status ? err.status : (err.error && err.error.code && err.error.code === 'ECONNREFUSED') ? 503 : 500,
        message: (err.error && err.error.message) ? err.error.message : err.message ? err.message : errMsg,
        error: (
          (err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
            (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
              (err.error && err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message :
                (err.error && err.error.message && typeof err.error.message === 'string') ? err.error.message :
                  (err.error && typeof err.error === 'string') ? err.error :
                    (err.message && typeof err.message === 'string') ? err.message : (typeof err === 'string') ? err : 'Unknown Error'
        )
      };
    }
    if (selectedNode.lnImplementation === 'ECL' && err.message && err.message.indexOf('Authentication Error') < 0 && err.name && err.name === 'StatusCodeError') { newErrorObj.statusCode = 500; }
    return newErrorObj;
  };

  public getRequestIP = (req) => ((typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) ||
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null));

  public getDummyData = (dataKey, lnImplementation) => {
    const dummyDataFile = this.appConfig.rtlConfFilePath + sep + 'ECLDummyData.log';
    return new Promise((resolve, reject) => {
      if (this.dummy_data_array_from_file.length === 0) {
        fs.readFile(dummyDataFile, 'utf8', (err, data) => {
          if (err) {
            if (err.code === 'ENOENT') {
              this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Dummy data file does not exist' });
            } else {
              this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Getting dummy data failed' });
            }
          } else {
            this.dummy_data_array_from_file = data.split('\n');
            resolve(this.filterData(dataKey, lnImplementation));
          }
        });
      } else {
        resolve(this.filterData(dataKey, lnImplementation));
      }
    });
  };

  public readCookie = () => {
    const exists = fs.existsSync(this.appConfig.SSO.rtlCookiePath);
    if (exists) {
      try {
        this.appConfig.SSO.cookieValue = fs.readFileSync(this.appConfig.SSO.rtlCookiePath, 'utf-8');
      } catch (err) {
        this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while reading cookie: \n' + err });
        throw new Error(err);
      }
    } else {
      try {
        const directoryName = dirname(this.appConfig.SSO.rtlCookiePath);
        this.createDirectory(directoryName);
        fs.writeFileSync(this.appConfig.SSO.rtlCookiePath, crypto.randomBytes(64).toString('hex'));
        this.appConfig.SSO.cookieValue = fs.readFileSync(this.appConfig.SSO.rtlCookiePath, 'utf-8');
      } catch (err) {
        this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while reading the cookie: \n' + err });
        throw new Error(err);
      }
    }
  };

  public refreshCookie = () => {
    try {
      fs.writeFileSync(this.appConfig.SSO.rtlCookiePath, crypto.randomBytes(64).toString('hex'));
      this.appConfig.SSO.cookieValue = fs.readFileSync(this.appConfig.SSO.rtlCookiePath, 'utf-8');
    } catch (err) {
      this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while refreshing cookie', error: err });
      throw new Error(err);
    }
  };

  public createDirectory = (directoryName) => {
    const initDir = isAbsolute(directoryName) ? sep : '';
    directoryName.split(sep)?.reduce((parentDir, childDir) => {
      const curDir = resolve(parentDir, childDir);
      try {
        if (!fs.existsSync(curDir)) {
          fs.mkdirSync(curDir);
        }
      } catch (err) {
        if (err.code !== 'EEXIST') {
          if (err.code === 'ENOENT') {
            throw new Error(`ENOENT: No such file or directory, mkdir '${directoryName}'. Ensure that the path separator is '${sep}'`);
          } else {
            throw err;
          }
        }
      }
      return curDir;
    }, initDir);
  };

  public replacePasswordWithHash = (multiPassHashed) => {
    this.appConfig.rtlConfFilePath = process.env.RTL_CONFIG_PATH ? process.env.RTL_CONFIG_PATH : join(dirname(fileURLToPath(import.meta.url)), '../..');
    try {
      const RTLConfFile = this.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
      const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      config.multiPassHashed = multiPassHashed;
      delete config.multiPass;
      fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
      this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Please note that, RTL has encrypted the plaintext password into its corresponding hash' });
      return config.multiPassHashed;
    } catch (err) {
      this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Password hashing failed', error: err });
    }
  };

  public getAllNodeAllChannelBackup = (node: SelectedNode) => {
    const channel_backup_file = node.Settings.channelBackupPath + sep + 'channel-all.bak';
    const options = {
      url: node.Settings.lnServerUrl + '/v1/channels/backup',
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': fs.readFileSync(node.Authentication.macaroonPath + '/admin.macaroon').toString('hex') }
    };
    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Getting Channel Backup for Node ' + node.lnNode + '..' });
    request(options).then((body) => {
      fs.writeFile(channel_backup_file, JSON.stringify(body), (err) => {
        if (err) {
          if (node.lnNode) {
            this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for Node ' + node.lnNode, error: err });
          } else {
            this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for File ' + channel_backup_file, error: err });
          }
        } else {
          if (node.lnNode) {
            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Successful in Channel Backup for Node ' + node.lnNode, data: body });
          } else {
            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'Common', msg: 'Successful in Channel Backup for File ' + channel_backup_file, data: body });
          }
        }
      });
    }, (err) => {
      this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for Node ' + node.lnNode, error: err });
      fs.writeFile(channel_backup_file, '', () => { });
    });
  };

  public isVersionCompatible = (currentVersion, checkVersion) => {
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
      } else {
        this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'Common', msg: 'Invalid Version String ' + currentVersion });
        return false;
      }
    }
    return false;
  };

  public getMonthDays = (selMonth, selYear) => ((selMonth === 1 && selYear % 4 === 0) ? (this.MONTHS[selMonth].days + 1) : this.MONTHS[selMonth].days);

  public logEnvVariables = (req) => {
    const selNode = <SelectedNode>req.session.selectedNode;
    if (selNode && selNode.index) {
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'PORT: ' + this.port });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'HOST: ' + this.host });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'DB_DIRECTORY_PATH: ' + this.appConfig.dbDirectoryPath });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'SSO: ' + this.appConfig.SSO.rtlSso });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'DEFAULT NODE INDEX: ' + selNode.index });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'INDEX: ' + selNode.index });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LN NODE: ' + selNode.lnNode });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LN IMPLEMENTATION: ' + selNode.lnImplementation });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'FIAT CONVERSION: ' + selNode.Settings.fiatConversion });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'CURRENCY UNIT: ' + selNode.Settings.currencyUnit });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LN SERVER URL: ' + selNode.Settings.lnServerUrl });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LOGOUT REDIRECT LINK: ' + this.appConfig.SSO.logoutRedirectLink + '\r\n' });
    }
  };

  public filterData = (dataKey, lnImplementation) => {
    let search_string = '';
    if (lnImplementation === 'ECL') {
      switch (dataKey) {
        case 'GetInfo': search_string = 'INFO: GetInfo => Get Info Response: '; break;
        case 'Fees': search_string = 'INFO: Fees => Fee Response: '; break;
        case 'Payments': search_string = 'INFO: Fees => Payments Response: '; break;
        case 'Invoices': search_string = 'INFO: Invoice => Invoices List Received: '; break;
        case 'OnChainBalance': search_string = 'INFO: Onchain => Balance Received: '; break;
        case 'Peers': search_string = 'INFO: Peers => Peers with Alias: '; break;
        case 'Channels': search_string = 'INFO: Channels => Simplified Channels with Alias: '; break;
        default: search_string = 'Random Line'; break;
      }
    } else if (lnImplementation === 'CLN') {
      switch (dataKey) {
        case 'GetInfo': search_string = 'DEBUG: GetInfo => Node Information. '; break;
        case 'Fees': search_string = 'DEBUG: Fees => Fee Received. '; break;
        case 'Payments': search_string = 'DEBUG: Payments => Payment List Received: '; break;
        case 'Invoices': search_string = 'DEBUG: Invoice => Invoices List Received. '; break;
        case 'ChannelBalance': search_string = 'DEBUG: Channels => Local Remote Balance. '; break;
        case 'Peers': search_string = 'DEBUG: Peers => Peers with Alias: '; break;
        case 'Channels': search_string = 'DEBUG: Channels => List Channels: '; break;
        case 'Balance': search_string = 'DEBUG: Balance => Balance Received. '; break;
        case 'ForwardingHistory': search_string = 'DEBUG: Channels => Forwarding History Received: '; break;
        case 'UTXOs': search_string = 'DEBUG: OnChain => List Funds Received. '; break;
        case 'FeeRateperkb': search_string = 'DEBUG: Network => Network Fee Rates Received for perkb. '; break;
        case 'FeeRateperkw': search_string = 'DEBUG: Network => Network Fee Rates Received for perkw. '; break;
        default: search_string = 'Random Line'; break;
      }
    }
    const foundDataLine = this.dummy_data_array_from_file.find((dataItem) => dataItem.includes(search_string));
    const dataStr = foundDataLine ? foundDataLine.substring((foundDataLine.indexOf(search_string)) + search_string.length) : '{}';
    return JSON.parse(dataStr);
  };

}

export const Common = new CommonService();

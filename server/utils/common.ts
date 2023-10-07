import * as fs from 'fs';
import { join, dirname, isAbsolute, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import * as crypto from 'crypto';
import request from 'request-promise';
import { Logger, LoggerService } from './logger.js';
import { CommonSelectedNode } from '../models/config.model.js';

export class CommonService {

  public logger: LoggerService = Logger;
  public nodes: CommonSelectedNode[] = [];
  public initSelectedNode: CommonSelectedNode = null;
  public rtl_conf_file_path = '';
  public port = 3000;
  public host = '';
  public db_directory_path = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  public rtl_pass = '';
  public flg_allow_password_update = true;
  public rtl_secret2fa = '';
  public rtl_sso = 0;
  public rtl_cookie_path = '';
  public logout_redirect_link = '';
  public cookie_value = '';
  public api_version = '';
  public secret_key = crypto.randomBytes(64).toString('hex');
  public read_dummy_data = false;
  public baseHref = '/rtl';
  private dummy_data_array_from_file = [];
  private MONTHS = [
    { name: 'JAN', days: 31 }, { name: 'FEB', days: 28 }, { name: 'MAR', days: 31 }, { name: 'APR', days: 30 }, { name: 'MAY', days: 31 }, { name: 'JUN', days: 30 },
    { name: 'JUL', days: 31 }, { name: 'AUG', days: 31 }, { name: 'SEP', days: 30 }, { name: 'OCT', days: 31 }, { name: 'NOV', days: 30 }, { name: 'DEC', days: 31 }
  ];

  constructor() { }

  public getSwapServerOptions = (req) => {
    const swapOptions = {
      url: req.session.selectedNode.swap_server_url,
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': '' }
    };
    if (req.session.selectedNode.swap_macaroon_path) {
      try {
        swapOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.swap_macaroon_path, 'loop.macaroon')).toString('hex') };
      } catch (err) {
        this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Loop macaroon Error', error: err });
      }
    }
    this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Swap Options', data: swapOptions });
    return swapOptions;
  };

  public getBoltzServerOptions = (req) => {
    const boltzOptions = {
      url: req.session.selectedNode.boltz_server_url,
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': '' }
    };
    if (req.session.selectedNode.boltz_macaroon_path) {
      try {
        boltzOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.boltz_macaroon_path, 'admin.macaroon')).toString('hex') };
      } catch (err) {
        this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Boltz macaroon Error', error: err });
      }
    }
    this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Boltz Options', data: boltzOptions });
    return boltzOptions;
  };

  public getOptions = (req) => {
    if (req.session.selectedNode && req.session.selectedNode.options) {
      req.session.selectedNode.options.method = (req.session.selectedNode.ln_implementation && req.session.selectedNode.ln_implementation.toUpperCase() !== 'ECL') ? 'GET' : 'POST';
      delete req.session.selectedNode.options.form;
      req.session.selectedNode.options.qs = {};
      return req.session.selectedNode.options;
    }
    return this.handleError({ statusCode: 401, message: 'Session expired after a day\'s inactivity' }, 'Session Expired', 'Session Expiry Error', this.initSelectedNode);
  };

  public updateSelectedNodeOptions = (req) => {
    if (!req.session.selectedNode) {
      req.session.selectedNode = {};
    }
    req.session.selectedNode.options = {
      url: '',
      rejectUnauthorized: false,
      json: true,
      form: null
    };
    try {
      if (req.session.selectedNode && req.session.selectedNode.ln_implementation) {
        switch (req.session.selectedNode.ln_implementation.toUpperCase()) {
          case 'CLN':
            req.session.selectedNode.options.headers = { macaroon: Buffer.from(fs.readFileSync(join(req.session.selectedNode.macaroon_path, 'access.macaroon'))).toString('base64') };
            break;

          case 'ECL':
            req.session.selectedNode.options.headers = { authorization: 'Basic ' + Buffer.from(':' + req.session.selectedNode.ln_api_password).toString('base64') };
            break;

          default:
            req.session.selectedNode.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(req.session.selectedNode.macaroon_path, 'admin.macaroon')).toString('hex') };
            break;
        }
      }
      if (req.session.selectedNode) {
        this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Updated Node Options for ' + req.session.selectedNode.ln_node, data: req.session.selectedNode.options });
      }
      return { status: 200, message: 'Updated Successfully' };
    } catch (err) {
      req.session.selectedNode.options = {
        url: '',
        rejectUnauthorized: false,
        json: true,
        form: null
      };
      this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Update Selected Node Options Error', error: err });
      return { status: 502, message: err };
    }
  };

  public setOptions = (req) => {
    if (this.nodes[0].options && this.nodes[0].options.headers) { return; }
    if (this.nodes && this.nodes.length > 0) {
      this.nodes.forEach((node) => {
        node.options = {
          url: '',
          rejectUnauthorized: false,
          json: true,
          form: null
        };
        try {
          if (node.ln_implementation) {
            switch (node.ln_implementation.toUpperCase()) {
              case 'CLN':
                node.options.headers = { macaroon: Buffer.from(fs.readFileSync(join(node.macaroon_path, 'access.macaroon'))).toString('base64') };
                break;

              case 'ECL':
                node.options.headers = { authorization: 'Basic ' + Buffer.from(':' + node.ln_api_password).toString('base64') };
                break;

              default:
                node.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(node.macaroon_path, 'admin.macaroon')).toString('hex') };
                break;
            }
          }
        } catch (err) {
          this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Common Set Options Error', error: err });
          node.options = {
            url: '',
            rejectUnauthorized: false,
            json: true,
            form: ''
          };
        }
        this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Set Node Options for ' + node.ln_node, data: node.options });
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

  public handleError = (errRes, fileName, errMsg, selectedNode: CommonSelectedNode) => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err && err.error && Object.keys(err.error).length === 0 && errRes.error && (errRes.error.stack || errRes.error.message)) {
      errRes.error = errRes.error.stack || errRes.error.message;
      err = JSON.parse(JSON.stringify(errRes));
    } else if (errRes.message || errRes.stack) {
      errRes.error = errRes.message || errRes.stack;
      err = JSON.parse(JSON.stringify(errRes));
    }
    if (!selectedNode) { selectedNode = this.initSelectedNode; }
    switch (selectedNode.ln_implementation) {
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
    if (selectedNode.ln_implementation === 'ECL' && err.message && err.message.indexOf('Authentication Error') < 0 && err.name && err.name === 'StatusCodeError') { newErrorObj.statusCode = 500; }
    return newErrorObj;
  };

  public getRequestIP = (req) => ((typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) ||
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null));

  public getDummyData = (dataKey, lnImplementation) => {
    const dummyDataFile = this.rtl_conf_file_path + sep + 'ECLDummyData.log';
    return new Promise((resolve, reject) => {
      if (this.dummy_data_array_from_file.length === 0) {
        fs.readFile(dummyDataFile, 'utf8', (err, data) => {
          if (err) {
            if (err.code === 'ENOENT') {
              this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Dummy data file does not exist' });
            } else {
              this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Getting dummy data failed' });
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
    const exists = fs.existsSync(this.rtl_cookie_path);
    if (exists) {
      try {
        this.cookie_value = fs.readFileSync(this.rtl_cookie_path, 'utf-8');
      } catch (err) {
        this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while reading cookie: \n' + err });
        throw new Error(err);
      }
    } else {
      try {
        const directoryName = dirname(this.rtl_cookie_path);
        this.createDirectory(directoryName);
        fs.writeFileSync(this.rtl_cookie_path, crypto.randomBytes(64).toString('hex'));
        this.cookie_value = fs.readFileSync(this.rtl_cookie_path, 'utf-8');
      } catch (err) {
        this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while reading the cookie: \n' + err });
        throw new Error(err);
      }
    }
  };

  public refreshCookie = () => {
    try {
      fs.writeFileSync(this.rtl_cookie_path, crypto.randomBytes(64).toString('hex'));
      this.cookie_value = fs.readFileSync(this.rtl_cookie_path, 'utf-8');
    } catch (err) {
      this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Something went wrong while refreshing cookie', error: err });
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
    this.rtl_conf_file_path = process.env.RTL_CONFIG_PATH ? process.env.RTL_CONFIG_PATH : join(dirname(fileURLToPath(import.meta.url)), '../..');
    try {
      const RTLConfFile = this.rtl_conf_file_path + sep + 'RTL-Config.json';
      const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      config.multiPassHashed = multiPassHashed;
      delete config.multiPass;
      fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
      this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Please note that, RTL has encrypted the plaintext password into its corresponding hash' });
      return config.multiPassHashed;
    } catch (err) {
      this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Password hashing failed', error: err });
    }
  };

  public getAllNodeAllChannelBackup = (node: CommonSelectedNode) => {
    const channel_backup_file = node.channel_backup_path + sep + 'channel-all.bak';
    const options = {
      url: node.ln_server_url + '/v1/channels/backup',
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': fs.readFileSync(node.macaroon_path + '/admin.macaroon').toString('hex') }
    };
    this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Getting Channel Backup for Node ' + node.ln_node + '..' });
    request(options).then((body) => {
      fs.writeFile(channel_backup_file, JSON.stringify(body), (err) => {
        if (err) {
          if (node.ln_node) {
            this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for Node ' + node.ln_node, error: err });
          } else {
            this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for File ' + channel_backup_file, error: err });
          }
        } else {
          if (node.ln_node) {
            this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Successful in Channel Backup for Node ' + node.ln_node, data: body });
          } else {
            this.logger.log({ selectedNode: this.initSelectedNode, level: 'INFO', fileName: 'Common', msg: 'Successful in Channel Backup for File ' + channel_backup_file, data: body });
          }
        }
      });
    }, (err) => {
      this.logger.log({ selectedNode: this.initSelectedNode, level: 'ERROR', fileName: 'Common', msg: 'Error in Channel Backup for Node ' + node.ln_node, error: err });
      fs.writeFile(channel_backup_file, '', () => { });
    });
  };

  public isVersionCompatible = (currentVersion, checkVersion) => {
    if (currentVersion) {
      const versionsArr = currentVersion.trim()?.replace('v', '').split('-')[0].split('.') || [];
      const checkVersionsArr = checkVersion.split('.');
      return (+versionsArr[0] > +checkVersionsArr[0]) ||
        (+versionsArr[0] === +checkVersionsArr[0] && +versionsArr[1] > +checkVersionsArr[1]) ||
        (+versionsArr[0] === +checkVersionsArr[0] && +versionsArr[1] === +checkVersionsArr[1] && +versionsArr[2] >= +checkVersionsArr[2]);
    }
    return false;
  };

  public getMonthDays = (selMonth, selYear) => ((selMonth === 1 && selYear % 4 === 0) ? (this.MONTHS[selMonth].days + 1) : this.MONTHS[selMonth].days);

  public logEnvVariables = (req) => {
    const selNode = <CommonSelectedNode>req.session.selectedNode;
    if (selNode && selNode.index) {
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'PORT: ' + this.port });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'HOST: ' + this.host });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'DB_DIRECTORY_PATH: ' + this.db_directory_path });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'SSO: ' + this.rtl_sso });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'DEFAULT NODE INDEX: ' + selNode.index });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'INDEX: ' + selNode.index });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LN NODE: ' + selNode.ln_node });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LN IMPLEMENTATION: ' + selNode.ln_implementation });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'FIAT CONVERSION: ' + selNode.fiat_conversion });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'CURRENCY UNIT: ' + selNode.currency_unit });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LN SERVER URL: ' + selNode.ln_server_url });
      this.logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Config Setup Variable', msg: 'LOGOUT REDIRECT LINK: ' + this.logout_redirect_link + '\r\n' });
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

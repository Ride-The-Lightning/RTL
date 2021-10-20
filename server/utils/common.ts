/* eslint-disable no-console */
import * as fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as os from 'os';
import * as crypto from 'crypto';
import request from 'request-promise';
import { CommonSelectedNode } from '../models/config.model.js';

export class CommonService {

  public nodes: CommonSelectedNode[] = [];
  public selectedNode: CommonSelectedNode = {};
  public rtl_conf_file_path = '';
  public port = 3000;
  public host = null;
  public path_separator = '/';
  public rtl_pass = '';
  public secret_key = crypto.randomBytes(64).toString('hex');
  public rtl_secret2fa = '';
  public rtl_sso = 0;
  public rtl_cookie_path = '';
  public logout_redirect_link = '';
  public cookie = '';
  public read_dummy_data = false;
  public platform = '/';
  public baseHref = '/rtl';
  private dummy_data_array_from_file = [];
  private MONTHS = [{ name: 'JAN', days: 31 }, { name: 'FEB', days: 28 }, { name: 'MAR', days: 31 }, { name: 'APR', days: 30 }, { name: 'MAY', days: 31 }, { name: 'JUN', days: 30 }, { name: 'JUL', days: 31 }, { name: 'AUG', days: 31 }, { name: 'SEP', days: 30 }, { name: 'OCT', days: 31 }, { name: 'NOV', days: 30 }, { name: 'DEC', days: 31 }];

  constructor() {
    this.platform = os.platform();
    this.path_separator = (this.platform === 'win32') ? '\\' : '/';
  }

  public getSwapServerOptions = () => {
    const swapOptions = {
      url: this.selectedNode.swap_server_url,
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': '' }
    };
    if (this.selectedNode.swap_macaroon_path) {
      try {
        swapOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(this.selectedNode.swap_macaroon_path, 'loop.macaroon')).toString('hex') };
      } catch (err) {
        console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Loop macaroon Error: ' + JSON.stringify(err));
      }
    }
    console.log('\r\n[' + new Date().toLocaleString() + '] INFO: Common => Swap Options: ' + JSON.stringify(swapOptions));
    return swapOptions;
  };

  public getBoltzServerOptions = () => {
    const boltzOptions = {
      url: this.selectedNode.boltz_server_url,
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': '' }
    };
    if (this.selectedNode.boltz_macaroon_path) {
      try {
        boltzOptions.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(this.selectedNode.boltz_macaroon_path, 'admin.macaroon')).toString('hex') };
      } catch (err) {
        console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Boltz macaroon Error: ' + JSON.stringify(err));
      }
    }
    console.log('\r\n[' + new Date().toLocaleString() + '] INFO: Common => Boltz Options: ' + JSON.stringify(boltzOptions));
    return boltzOptions;
  };

  public getSelLNServerUrl = () => this.selectedNode.ln_server_url;

  public getOptions = () => {
    this.selectedNode.options.method = (this.selectedNode && this.selectedNode.ln_implementation && this.selectedNode.ln_implementation.toUpperCase() !== 'ECL') ? 'GET' : 'POST';
    delete this.selectedNode.options.form;
    this.selectedNode.options.qs = {};
    return this.selectedNode.options;
  };

  public updateSelectedNodeOptions = () => {
    if (!this.selectedNode) {
      this.selectedNode = {};
    }
    this.selectedNode.options = {
      url: '',
      rejectUnauthorized: false,
      json: true,
      form: null
    };
    try {
      if (this.selectedNode && this.selectedNode.ln_implementation) {
        switch (this.selectedNode.ln_implementation.toUpperCase()) {
          case 'CLT':
            this.selectedNode.options.headers = { macaroon: Buffer.from(fs.readFileSync(join(this.selectedNode.macaroon_path, 'access.macaroon'))).toString('base64') };
            break;

          case 'ECL':
            this.selectedNode.options.headers = { authorization: 'Basic ' + Buffer.from(':' + this.selectedNode.ln_api_password).toString('base64') };
            break;

          default:
            this.selectedNode.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(this.selectedNode.macaroon_path, 'admin.macaroon')).toString('hex') };
            break;
        }
      }
      if (this.selectedNode) {
        console.log('\r\n[' + new Date().toLocaleString() + '] INFO: Common => Updated Node Options: ' + JSON.stringify(this.selectedNode.options));
      }
      return { status: 200, message: 'Updated Successfully!' };
    } catch (err) {
      this.selectedNode.options = {
        url: '',
        rejectUnauthorized: false,
        json: true,
        form: null
      };
      console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Common Update Selected Node Options Error:' + JSON.stringify(err));
      return { status: 502, message: err };
    }
  };

  public setOptions = () => {
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
              case 'CLT':
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
          console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Common Set Options Error:' + JSON.stringify(err));
          node.options = {
            url: '',
            rejectUnauthorized: false,
            json: true,
            form: ''
          };
        }
        console.log('\r\n[' + new Date().toLocaleString() + '] INFO: Common => Set Node Options: ' + JSON.stringify(node.options));
      });
      this.updateSelectedNodeOptions();
    }
  };

  public findNode = (selNodeIndex) => this.nodes.find((node) => node.index === selNodeIndex);

  public replaceNode = (selNodeIndex, newNode) => {
    const foundIndex = this.nodes.findIndex((node) => node.index === selNodeIndex);
    this.nodes.splice(foundIndex, 1, newNode);
    this.selectedNode = this.findNode(selNodeIndex);
  };

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
    array.unshift(newlyAddedRecord[0]);
    return array;
  };

  public handleError = (errRes, fileName, errMsg) => {
    const err = JSON.parse(JSON.stringify(errRes));
    switch (this.selectedNode && this.selectedNode.ln_implementation) {
      case 'LND':
        if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
          delete err.options.headers['Grpc-Metadata-macaroon'];
        }
        if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
          delete err.response.request.headers['Grpc-Metadata-macaroon'];
        }
        break;

      case 'CLT':
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
    const msgStr = '\r\n[' + new Date().toLocaleString() + '] ERROR: ' + fileName + ' => ' + errMsg + ': ' + (typeof err === 'object' ? JSON.stringify(err) : (typeof err === 'string') ? err : 'Unknown Error');
    console.error(msgStr);
    if (this.selectedNode && this.selectedNode.log_file) { fs.appendFile(this.selectedNode.log_file, msgStr, () => {}); }
    const newErrorObj = {
      statusCode: err.statusCode ? err.statusCode : err.status ? err.status : (err.error && err.error.code && err.error.code === 'ECONNREFUSED') ? 503 : 500,
      message: (err.error && err.error.message) ? err.error.message : err.message ? err.message : errMsg,
      error: (
        (err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
          (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
            (err.error && err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message :
              (err.error && err.error.message && typeof err.error.message === 'string') ? err.error.message :
                (err.message && typeof err.message === 'string') ? err.message :
                  (err.error) ? err.error : (typeof err === 'string') ? err : 'Unknown Error'
      )
    };
    return newErrorObj;
  };

  public getRequestIP = (req) => ((typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) ||
      req.ip ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null));

  public getDummyData = (dataKey) => {
    const dummyDataFile = this.rtl_conf_file_path + this.path_separator + 'ECLDummyData.log';
    return new Promise((resolve, reject) => {
      if (this.dummy_data_array_from_file.length === 0) {
        fs.readFile(dummyDataFile, 'utf8', (err, data) => {
          if (err) {
            if (err.code === 'ENOENT') {
              console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Dummy data file does not exist!');
            } else {
              console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Getting dummy data failed!');
            }
          } else {
            this.dummy_data_array_from_file = data.split('\n');
            resolve(this.filterData(dataKey));
          }
        });
      } else {
        resolve(this.filterData(dataKey));
      }
    });
  };

  public refreshCookie = (cookieFile) => {
    try {
      fs.writeFileSync(cookieFile, crypto.randomBytes(64).toString('hex'));
      this.cookie = fs.readFileSync(cookieFile, 'utf-8');
    } catch (err) {
      console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Something went wrong while refreshing cookie: \n' + err);
      throw new Error(err);
    }
  }

  public replacePasswordWithHash = (multiPassHashed) => {
    this.rtl_conf_file_path = process.env.RTL_CONFIG_PATH ? process.env.RTL_CONFIG_PATH : join(dirname(fileURLToPath(import.meta.url)), '../..');
    try {
      const RTLConfFile = this.rtl_conf_file_path + this.path_separator + 'RTL-Config.json';
      const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
      config.multiPassHashed = multiPassHashed;
      delete config.multiPass;
      fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
      console.log('\r\n[' + new Date().toLocaleString() + '] INFO: Common => Please note that, RTL has encrypted the plaintext password into its corresponding hash.');
      return config.multiPassHashed;
    } catch (err) {
      console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Password hashing failed!');
    }
  }

  public getAllNodeAllChannelBackup = (node) => {
    const channel_backup_file = node.channel_backup_path + this.path_separator + 'channel-all.bak';
    const options = {
      url: node.ln_server_url + '/v1/channels/backup',
      rejectUnauthorized: false,
      json: true,
      headers: { 'Grpc-Metadata-macaroon': fs.readFileSync(node.macaroon_path + '/admin.macaroon').toString('hex') }
    };
    request(options).then((body) => {
      fs.writeFile(channel_backup_file, JSON.stringify(body), (err) => {
        if (err) {
          if (node.ln_node) {
            console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Channel Backup Failed for Node ' + node.ln_node + ': ' + JSON.stringify(err));
          } else {
            console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Channel Backup Error: ' + JSON.stringify(err));
          }
        } else {
          if (node.ln_node) {
            console.log('\r\n[' + new Date().toLocaleString() + '] INFO: Common => Channel Backup Successful for Node: ' + JSON.stringify(node.ln_node));
          } else {
            console.log('\r\n[' + new Date().toLocaleString() + '] INFO: Common => Channel Backup Successful');
          }
        }
      });
    }, (err) => {
      console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Channel Backup Response Error: ' + JSON.stringify(err));
      fs.writeFile(channel_backup_file, '', (writeErr) => {
        if (writeErr) {
          console.error('\r\n[' + new Date().toLocaleString() + '] ERROR: Common => Channel Backup Response Empty File Write Error: ' + JSON.stringify(writeErr));
        }
      });
    });
  };

  public getMonthDays = (selMonth, selYear) => ((selMonth === 1 && selYear % 4 === 0) ? (this.MONTHS[selMonth].days + 1) : this.MONTHS[selMonth].days);

  public filterData = (dataKey) => {
    let search_string = '';
    if (this.selectedNode.ln_implementation === 'ECL') {
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
    } else if (this.selectedNode.ln_implementation === 'CLT') {
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
  }

}

export const Common = new CommonService();

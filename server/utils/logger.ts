/* eslint-disable no-console */
import * as fs from 'fs';
import { LogJSONObj } from '../models/config.model.js';

export class LoggerService {

  log = (msgJSON: LogJSONObj) => {
    let msgStr = '\r\n[' + new Date().toLocaleString() + '] ' + msgJSON.level + ': ' + msgJSON.fileName + ' => ' + msgJSON.msg;
    switch (msgJSON.level) {
      case 'ERROR':
        if (msgJSON.error) {
          msgStr = msgStr + ': ' + ((msgJSON.error.error && msgJSON.error.error.message && typeof msgJSON.error.error.message === 'string') ? msgJSON.error.error.message : (typeof msgJSON.error === 'object' && msgJSON.error.stack) ? JSON.stringify(msgJSON.error.stack) : (typeof msgJSON.error === 'object') ? JSON.stringify(msgJSON.error) : (typeof msgJSON.error === 'string') ? msgJSON.error : '');
        } else {
          msgStr = msgStr + '.';
        }
        console.error(msgStr);
        if (msgJSON.selectedNode.log_file) {
          fs.appendFile(msgJSON.selectedNode.log_file, msgStr, () => { });
        }
        break;

      case 'WARN':
        if (!msgJSON.selectedNode) {
          console.warn(prepMsgData(msgJSON, msgStr));
        } else if (msgJSON.selectedNode && (msgJSON.selectedNode.log_level === 'INFO' || msgJSON.selectedNode.log_level === 'WARN' || msgJSON.selectedNode.log_level === 'DEBUG')) {
          msgStr = prepMsgData(msgJSON, msgStr);
          console.warn(msgStr);
          if (msgJSON.selectedNode.log_file) {
            fs.appendFile(msgJSON.selectedNode.log_file, msgStr, () => { });
          }
        }
        break;

      case 'DEBUG':
      case 'INFO':
        if (!msgJSON.selectedNode) {
          console.log(prepMsgData(msgJSON, msgStr));
        } else if (msgJSON.selectedNode && (msgJSON.selectedNode.log_level === 'DEBUG')) {
          if (typeof msgJSON.data !== 'string' && msgJSON.data && msgJSON.data.length && msgJSON.data.length > 0) {
            msgStr = msgJSON.data.reduce((accumulator, dataEle) => accumulator + (typeof dataEle === 'object' ? JSON.stringify(dataEle) : (typeof dataEle === 'string') ? dataEle : '') + ', ', msgStr + ': [');
            msgStr = msgStr.slice(0, -2) + ']';
          } else {
            msgStr = prepMsgData(msgJSON, msgStr);
          }
          console.log(msgStr);
          if (msgJSON.selectedNode.log_file) {
            fs.appendFile(msgJSON.selectedNode.log_file, msgStr, () => { });
          }
        }
        break;

      default:
        console.log(msgStr);
        break;
    }
  };

};

const prepMsgData = (msgJSON, msgStr) => {
  if (msgJSON.data) {
    msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '');
  } else {
    msgStr = msgStr + '.';
  }
  return msgStr;
};

export const Logger = new LoggerService();

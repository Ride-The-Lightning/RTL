/* eslint-disable no-console */
import * as fs from 'fs';
import { Common } from './common.js';
export class LoggerService {
    constructor() {
        this.common = Common;
        this.log = (msgJSON, selNode = this.common.selectedNode) => {
            let msgStr = '\r\n[' + new Date().toLocaleString() + '] ' + msgJSON.level + ': ' + msgJSON.fileName + ' => ' + msgJSON.msg;
            switch (msgJSON.level) {
                case 'ERROR':
                    if (selNode) {
                        if (msgJSON.error) {
                            msgStr = msgStr + ': ' + ((msgJSON.error.error && msgJSON.error.error.message && typeof msgJSON.error.error.message === 'string') ? msgJSON.error.error.message : typeof msgJSON.error === 'object' ? JSON.stringify(msgJSON.error) : (typeof msgJSON.error === 'string') ? msgJSON.error : '');
                        }
                        else {
                            msgStr = msgStr + '.';
                        }
                        console.error(msgStr);
                        if (selNode.log_file) {
                            fs.appendFile(selNode.log_file, msgStr, () => { });
                        }
                    }
                    break;
                case 'WARN':
                    if (selNode && (selNode.log_level === 'INFO' || selNode.log_level === 'WARN' || selNode.log_level === 'DEBUG')) {
                        if (msgJSON.data) {
                            msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '');
                        }
                        else {
                            msgStr = msgStr + '.';
                        }
                        console.warn(msgStr);
                        if (selNode.log_file) {
                            fs.appendFile(selNode.log_file, msgStr, () => { });
                        }
                    }
                    break;
                case 'DEBUG':
                    if (selNode && selNode.log_level === 'DEBUG') {
                        if (typeof msgJSON.data !== 'string' && msgJSON.data && msgJSON.data.length && msgJSON.data.length > 0) {
                            msgStr = msgJSON.data.reduce((accumulator, dataEle) => accumulator + (typeof dataEle === 'object' ? JSON.stringify(dataEle) : (typeof dataEle === 'string') ? dataEle : '') + ', ', msgStr + ': [');
                            msgStr = msgStr.slice(0, -2) + ']';
                        }
                        else {
                            if (msgJSON.data && msgJSON.data !== '') {
                                msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : typeof msgJSON.data === 'string' ? msgJSON.data : '');
                            }
                            else {
                                msgStr = msgStr + '.';
                            }
                        }
                        console.log(msgStr);
                        if (selNode.log_file) {
                            fs.appendFile(selNode.log_file, msgStr, () => { });
                        }
                    }
                    break;
                case 'INFO':
                    if (selNode) {
                        if (msgJSON.data) {
                            msgStr = msgStr + '. ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '');
                        }
                        else {
                            msgStr = msgStr + '.';
                        }
                        console.log(msgStr);
                    }
                    break;
                default:
                    console.log(msgStr, selNode);
                    break;
            }
        };
    }
}
;
export const Logger = new LoggerService();

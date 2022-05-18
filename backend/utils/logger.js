/* eslint-disable no-console */
import * as fs from 'fs';
export class LoggerService {
    constructor() {
        this.log = (msgJSON) => {
            let msgStr = '[' + new Date().toLocaleString() + '] ' + msgJSON.level + ': ' + msgJSON.fileName + ' => ' + msgJSON.msg;
            switch (msgJSON.level) {
                case 'ERROR':
                    if (msgJSON.error) {
                        msgStr =
                            msgStr +
                                ': ' +
                                (msgJSON.error.error && msgJSON.error.error.message && typeof msgJSON.error.error.message === 'string'
                                    ? msgJSON.error.error.message
                                    : typeof msgJSON.error === 'object' && msgJSON.error.message && typeof msgJSON.error.message === 'string'
                                        ? msgJSON.error.message
                                        : typeof msgJSON.error === 'object' && msgJSON.error.stack && typeof msgJSON.error.stack === 'string'
                                            ? msgJSON.error.stack
                                            : typeof msgJSON.error === 'object'
                                                ? JSON.stringify(msgJSON.error)
                                                : typeof msgJSON.error === 'string'
                                                    ? msgJSON.error
                                                    : '') +
                                '\r\n';
                    }
                    else {
                        msgStr = msgStr + '.\r\n';
                    }
                    console.error(msgStr);
                    if (msgJSON.selectedNode && msgJSON.selectedNode.log_file) {
                        fs.appendFile(msgJSON.selectedNode.log_file, msgStr, () => { });
                    }
                    break;
                case 'WARN':
                    msgStr = prepMsgData(msgJSON, msgStr);
                    if (!msgJSON.selectedNode ||
                        msgJSON.selectedNode.log_level === 'WARN' ||
                        msgJSON.selectedNode.log_level === 'INFO' ||
                        msgJSON.selectedNode.log_level === 'DEBUG') {
                        console.warn(msgStr);
                        if (msgJSON.selectedNode && msgJSON.selectedNode.log_file) {
                            fs.appendFile(msgJSON.selectedNode.log_file, msgStr, () => { });
                        }
                    }
                    break;
                case 'INFO':
                    if (!msgJSON.selectedNode && msgJSON.fileName === 'RTL') {
                        console.log(msgStr + '.\r\n');
                    }
                    else if (msgJSON.selectedNode && msgJSON.selectedNode.log_level === 'INFO') {
                        msgStr = msgStr + '.\r\n';
                        console.log(msgStr);
                        if (msgJSON.selectedNode.log_file) {
                            fs.appendFile(msgJSON.selectedNode.log_file, msgStr, () => { });
                        }
                    }
                    else if (msgJSON.selectedNode && msgJSON.selectedNode.log_level === 'DEBUG') {
                        msgStr = prepMsgData(msgJSON, msgStr);
                        console.log(msgStr);
                        if (msgJSON.selectedNode.log_file) {
                            fs.appendFile(msgJSON.selectedNode.log_file, msgStr, () => { });
                        }
                    }
                    break;
                case 'DEBUG':
                    if (!msgJSON.selectedNode) {
                        console.log(msgStr + '.\r\n');
                    }
                    else if (msgJSON.selectedNode && msgJSON.selectedNode.log_level === 'DEBUG') {
                        msgStr = prepMsgData(msgJSON, msgStr);
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
    }
}
const prepMsgData = (msgJSON, msgStr) => {
    if (msgJSON.data) {
        msgStr =
            msgStr +
                ': ' +
                (typeof msgJSON.data === 'object'
                    ? msgJSON.data.message && typeof msgJSON.data.message === 'string'
                        ? msgJSON.data.message
                        : msgJSON.data.stack && typeof msgJSON.data.stack === 'string'
                            ? msgJSON.data.stack
                            : JSON.stringify(msgJSON.data)
                    : typeof msgJSON.data === 'string'
                        ? msgJSON.data
                        : '') +
                '\r\n';
    }
    else {
        msgStr = msgStr + '.\r\n';
    }
    return msgStr;
};
export const Logger = new LoggerService();

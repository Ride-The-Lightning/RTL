import WebSocket from 'ws';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
export class ECLWebSocketClient {
    constructor() {
        this.logger = Logger;
        this.common = Common;
        this.wsServer = WSServer;
        this.webSocketClient = null;
        this.reconnectTimeOut = null;
        this.waitTime = 0.5;
        this.selectedNode = null;
        this.prevMessage = {};
        this.reconnet = () => {
            if (this.reconnectTimeOut) {
                return;
            }
            this.waitTime = (this.waitTime >= 16) ? 16 : (this.waitTime * 2);
            this.reconnectTimeOut = setTimeout(() => {
                if (this.selectedNode) {
                    this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Reconnecting to the Eclair\'s Websocket Server.' });
                    this.connect(this.selectedNode);
                }
                this.reconnectTimeOut = null;
            }, this.waitTime * 1000);
        };
        this.connect = (selectedNode) => {
            try {
                if (!this.webSocketClient || this.webSocketClient.readyState !== WebSocket.OPEN) {
                    this.selectedNode = selectedNode;
                    if (this.selectedNode && this.selectedNode.ln_server_url) {
                        const UpdatedLNServerURL = (this.selectedNode.ln_server_url).replace(/^http/, 'ws');
                        const firstSubStrIndex = (UpdatedLNServerURL.indexOf('//') + 2);
                        const WS_LINK = UpdatedLNServerURL.slice(0, firstSubStrIndex) + ':' + this.selectedNode.ln_api_password + '@' + UpdatedLNServerURL.slice(firstSubStrIndex) + '/ws';
                        this.webSocketClient = new WebSocket(WS_LINK);
                        this.webSocketClient.onopen = this.onClientOpen;
                        this.webSocketClient.onclose = this.onClientClose;
                        this.webSocketClient.onmessage = this.onClientMessage;
                        this.webSocketClient.onerror = this.onClientError;
                    }
                }
            }
            catch (err) {
                throw new Error(err);
            }
        };
        this.onClientOpen = () => {
            this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Connected to the Eclair\'s Websocket Server.' });
            this.waitTime = 0.5;
        };
        this.onClientClose = (e) => {
            if (this.selectedNode && this.selectedNode.ln_implementation === 'ECL') {
                this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Web socket disconnected, will reconnect again..' });
                this.webSocketClient.close();
                this.reconnet();
            }
        };
        this.onClientMessage = (msg) => {
            this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Received message from the server..', data: msg.data });
            msg = (typeof msg.data === 'string') ? JSON.parse(msg.data) : msg.data;
            msg['source'] = 'ECL';
            const msgStr = JSON.stringify(msg);
            if (this.prevMessage.hasOwnProperty(msg.type) && this.prevMessage[msg.type] === msgStr) {
                return;
            }
            this.prevMessage[msg.type] = msgStr;
            this.wsServer.sendEventsToAllWSClients(msgStr);
        };
        this.onClientError = (err) => {
            this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'ECLWebSocket', msg: 'Web socket error', error: err });
            this.wsServer.sendErrorToAllWSClients(err);
            this.webSocketClient.close();
            this.reconnet();
        };
        this.disconnect = () => {
            if (this.webSocketClient && this.webSocketClient.readyState === WebSocket.OPEN) {
                this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Disconnecting from the Eclair\'s Websocket Server.' });
                this.webSocketClient.close();
            }
            this.selectedNode = null;
        };
    }
}
export const ECLWSClient = new ECLWebSocketClient();

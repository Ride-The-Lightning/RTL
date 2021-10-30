import * as fs from 'fs';
import { join } from 'path';
import WebSocket from 'ws';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
export class CLWebSocketClient {
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
                this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Reconnecting to the CLightning\'s Websocket Server..' });
                this.connect(this.selectedNode);
                this.reconnectTimeOut = null;
            }, this.waitTime * 1000);
        };
        this.connect = (selectedNode) => {
            try {
                if (!this.webSocketClient || this.webSocketClient.readyState !== WebSocket.OPEN) {
                    if (!this.selectedNode) {
                        this.selectedNode = selectedNode;
                    }
                    this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connecting to the CLightning\'s Websocket Server..' });
                    const WS_LINK = (selectedNode.ln_server_url).replace(/^http/, 'ws') + '/v1/ws';
                    const mcrnHexEncoded = Buffer.from(fs.readFileSync(join(selectedNode.macaroon_path, 'access.macaroon'))).toString('hex');
                    this.webSocketClient = new WebSocket(WS_LINK, [mcrnHexEncoded, 'hex'], { rejectUnauthorized: false });
                    this.webSocketClient.onopen = this.onClientOpen;
                    this.webSocketClient.onclose = this.onClientClose;
                    this.webSocketClient.onmessage = this.onClientMessage;
                    this.webSocketClient.onerror = this.onClientError;
                }
            }
            catch (err) {
                throw new Error(err);
            }
        };
        this.onClientOpen = () => {
            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connected to the CLightning\'s Websocket Server..' });
            this.waitTime = 0.5;
        };
        this.onClientClose = (e) => {
            if (this.selectedNode && this.selectedNode.ln_implementation === 'CLT') {
                this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Web socket disconnected, will reconnect again...' });
                this.webSocketClient.close();
                this.reconnet();
            }
        };
        this.onClientMessage = (msg) => {
            this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Received message from the server..', data: msg.data });
            msg = (typeof msg.data === 'string') ? JSON.parse(msg.data) : msg.data;
            msg['source'] = 'CLT';
            const msgStr = JSON.stringify(msg);
            if (this.prevMessage.hasOwnProperty(msg.event) && this.prevMessage[msg.event] === msgStr) {
                return;
            }
            this.prevMessage[msg.event] = msgStr;
            this.wsServer.sendEventsToAllWSClients(msgStr);
        };
        this.onClientError = (err) => {
            this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'CLWebSocket', msg: 'Web socket error', error: err });
            this.wsServer.sendErrorToAllWSClients(err);
            this.webSocketClient.close();
            this.reconnet();
        };
        this.disconnect = () => {
            if (this.webSocketClient && this.webSocketClient.readyState === WebSocket.OPEN) {
                this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Disconnecting from the CLightning\'s Websocket Server..' });
                this.webSocketClient.close();
            }
        };
    }
}
export const CLWSClient = new CLWebSocketClient();

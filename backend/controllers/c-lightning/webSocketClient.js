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
        this.webSocketClients = [];
        this.reconnectTimeOut = null;
        this.waitTime = 0.5;
        this.reconnet = (clWsClt) => {
            if (this.reconnectTimeOut) {
                return;
            }
            this.waitTime = (this.waitTime >= 64) ? 64 : (this.waitTime * 2);
            this.reconnectTimeOut = setTimeout(() => {
                if (clWsClt.selectedNode) {
                    this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Reconnecting to the CLightning\'s Websocket Server..' });
                    this.connect(clWsClt.selectedNode);
                }
                this.reconnectTimeOut = null;
            }, this.waitTime * 1000);
        };
        this.connect = (selectedNode) => {
            try {
                const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode === selectedNode);
                if (!clientExists) {
                    if (selectedNode.ln_server_url) {
                        const newWebSocketClient = { selectedNode: selectedNode, reConnect: true, webSocketClient: null };
                        this.connectWithClient(newWebSocketClient);
                        this.webSocketClients.push(newWebSocketClient);
                    }
                }
                else {
                    if ((!clientExists.webSocketClient || clientExists.webSocketClient.readyState !== WebSocket.OPEN) && selectedNode.ln_server_url) {
                        clientExists.reConnect = true;
                        this.connectWithClient(clientExists);
                    }
                }
            }
            catch (err) {
                throw new Error(err);
            }
        };
        this.connectWithClient = (clWsClt) => {
            this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connecting to the CLightning\'s Websocket Server..' });
            const WS_LINK = (clWsClt.selectedNode.ln_server_url).replace(/^http/, 'ws') + '/v1/ws';
            const mcrnHexEncoded = Buffer.from(fs.readFileSync(join(clWsClt.selectedNode.macaroon_path, 'access.macaroon'))).toString('hex');
            clWsClt.webSocketClient = new WebSocket(WS_LINK, [mcrnHexEncoded, 'hex'], { rejectUnauthorized: false });
            clWsClt.webSocketClient.onopen = () => {
                this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connected to the CLightning\'s Websocket Server..' });
                this.waitTime = 0.5;
            };
            clWsClt.webSocketClient.onclose = (e) => {
                if (clWsClt && clWsClt.selectedNode && clWsClt.selectedNode.ln_implementation === 'CLT') {
                    this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Web socket disconnected, will reconnect again...' });
                    clWsClt.webSocketClient.close();
                    if (clWsClt.reConnect) {
                        this.reconnet(clWsClt);
                    }
                }
            };
            clWsClt.webSocketClient.onmessage = (msg) => {
                this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Received message from the server..', data: msg.data });
                msg = (typeof msg.data === 'string') ? JSON.parse(msg.data) : msg.data;
                msg['source'] = 'CLT';
                const msgStr = JSON.stringify(msg);
                this.wsServer.sendEventsToAllLNClient(msgStr, clWsClt.selectedNode);
            };
            clWsClt.webSocketClient.onerror = (err) => {
                this.common.api_version = '0.5.1';
                if (this.common.api_version === '' || this.common.isVersionCompatible(this.common.api_version, '0.5.3')) {
                    this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'ERROR', fileName: 'CLWebSocket', msg: 'Web socket error', error: err });
                    this.wsServer.sendErrorToAllLNClient(err, clWsClt.selectedNode);
                    clWsClt.webSocketClient.close();
                    if (clWsClt.reConnect) {
                        this.reconnet(clWsClt);
                    }
                }
                else {
                    clWsClt.reConnect = false;
                }
            };
        };
        this.disconnect = (selectedNode) => {
            const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode === selectedNode);
            if (clientExists && clientExists.webSocketClient && clientExists.webSocketClient.readyState === WebSocket.OPEN) {
                this.logger.log({ selectedNode: clientExists.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Disconnecting from the CLightning\'s Websocket Server..' });
                clientExists.reConnect = false;
                clientExists.webSocketClient.close();
                const clientIdx = this.webSocketClients.findIndex((wsc) => wsc.selectedNode === selectedNode);
                this.webSocketClients.splice(clientIdx, 1);
            }
        };
        this.wsServer.eventEmitterCLT.on('CONNECT', (nodeIndex) => {
            this.connect(this.common.findNode(+nodeIndex));
        });
        this.wsServer.eventEmitterCLT.on('DISCONNECT', (nodeIndex) => {
            this.disconnect(this.common.findNode(+nodeIndex));
        });
    }
}
export const CLWSClient = new CLWebSocketClient();

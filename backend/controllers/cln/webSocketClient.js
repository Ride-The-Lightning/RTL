import socketIOClient from 'socket.io-client';
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
        this.reconnect = (clWsClt) => {
            if (this.reconnectTimeOut) {
                return;
            }
            this.waitTime = (this.waitTime >= 64) ? 64 : (this.waitTime * 2);
            this.reconnectTimeOut = setTimeout(() => {
                if (clWsClt.selectedNode) {
                    this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Reconnecting to the Core Lightning\'s Websocket Server..' });
                    this.connect(clWsClt.selectedNode);
                }
                this.reconnectTimeOut = null;
            }, this.waitTime * 1000);
        };
        this.connect = (selectedNode) => {
            try {
                const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
                if (!clientExists) {
                    if (selectedNode.settings.lnServerUrl) {
                        const newWebSocketClient = { selectedNode: selectedNode, reConnect: true, webSocketClient: null };
                        this.connectWithClient(newWebSocketClient);
                        this.webSocketClients.push(newWebSocketClient);
                    }
                }
                else {
                    if ((!clientExists.webSocketClient || !clientExists.webSocketClient.connected) && selectedNode.settings.lnServerUrl) {
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
            this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connecting to the Core Lightning\'s Websocket Server..' });
            try {
                if (!clWsClt.selectedNode.authentication.runeValue) {
                    clWsClt.selectedNode.authentication.runeValue = this.common.getRuneValue(clWsClt.selectedNode.authentication.runePath);
                }
                clWsClt.webSocketClient = socketIOClient(clWsClt.selectedNode.settings.lnServerUrl, {
                    extraHeaders: { rune: clWsClt.selectedNode.authentication.runeValue },
                    transports: ['websocket'],
                    secure: true,
                    rejectUnauthorized: false
                });
            }
            catch (err) {
                throw new Error(err);
            }
            clWsClt.webSocketClient.on('connect', () => {
                this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connected to the Core Lightning\'s Websocket Server..' });
                this.waitTime = 0.5;
            });
            clWsClt.webSocketClient.on('disconnect', (reason) => {
                if (clWsClt && clWsClt.selectedNode && clWsClt.selectedNode.lnImplementation === 'CLN') {
                    this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Web socket disconnected, will reconnect again...', data: reason });
                    clWsClt.webSocketClient.close();
                    if (clWsClt.reConnect) {
                        this.reconnect(clWsClt);
                    }
                }
            });
            clWsClt.webSocketClient.on('message', (msg) => {
                this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'DEBUG', fileName: 'CLWebSocket', msg: 'Received message from the server..', data: msg.data });
                this.wsServer.sendEventsToAllLNClients(JSON.stringify({ source: 'CLN', data: msg }), clWsClt.selectedNode);
            });
            clWsClt.webSocketClient.on('error', (err) => {
                this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'ERROR', fileName: 'CLWebSocket', msg: 'Web socket error', error: err });
                const errStr = ((typeof err === 'object' && err.message) ? JSON.stringify({ error: err.message }) : (typeof err === 'object') ? JSON.stringify({ error: err }) : ('{ "error": ' + err + ' }'));
                this.wsServer.sendErrorToAllLNClients(errStr, clWsClt.selectedNode);
                clWsClt.webSocketClient.close();
                if (clWsClt.reConnect) {
                    this.reconnect(clWsClt);
                }
            });
        };
        this.disconnect = (selectedNode) => {
            const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
            if (clientExists && clientExists.webSocketClient && clientExists.webSocketClient.connected) {
                this.logger.log({ selectedNode: clientExists.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Disconnecting from the Core Lightning\'s Websocket Server..' });
                clientExists.reConnect = false;
                clientExists.webSocketClient.close();
                const clientIdx = this.webSocketClients.findIndex((wsc) => wsc.selectedNode.index === selectedNode.index);
                this.webSocketClients.splice(clientIdx, 1);
            }
        };
        this.updateSelectedNode = (newSelectedNode) => {
            const clientIdx = this.webSocketClients.findIndex((wsc) => +wsc.selectedNode.index === +newSelectedNode.index);
            let newClient = this.webSocketClients[clientIdx];
            if (!newClient) {
                newClient = { selectedNode: null, reConnect: true, webSocketClient: null };
            }
            newClient.selectedNode = JSON.parse(JSON.stringify(newSelectedNode));
            this.webSocketClients[clientIdx] = newClient;
        };
        this.wsServer.eventEmitterCLN.on('CONNECT', (nodeIndex) => {
            this.connect(this.common.findNode(+nodeIndex));
        });
        this.wsServer.eventEmitterCLN.on('DISCONNECT', (nodeIndex) => {
            this.disconnect(this.common.findNode(+nodeIndex));
        });
    }
}
export const CLWSClient = new CLWebSocketClient();

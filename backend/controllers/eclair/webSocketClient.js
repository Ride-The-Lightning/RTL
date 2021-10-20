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
        this.reconnet = () => {
            if (this.reconnectTimeOut) {
                return;
            }
            this.waitTime = (this.waitTime >= 16) ? 16 : (this.waitTime * 2);
            this.reconnectTimeOut = setTimeout(() => {
                this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Reconnecting to the Eclair\'s Websocket Server.' });
                this.connect();
                this.reconnectTimeOut = null;
            }, this.waitTime * 1000);
        };
        this.connect = () => {
            try {
                const UpdatedLNServerURL = this.common.getSelLNServerUrl().replace(/^http/, 'ws');
                const firstSubStrIndex = (UpdatedLNServerURL.indexOf('//') + 2);
                const WS_LINK = UpdatedLNServerURL.slice(0, firstSubStrIndex) + ':' + this.common.selectedNode.ln_api_password + '@' + UpdatedLNServerURL.slice(firstSubStrIndex) + '/ws';
                this.webSocketClient = new WebSocket(WS_LINK);
                this.webSocketClient.onopen = this.onClientOpen;
                this.webSocketClient.onclose = this.onClientClose;
                this.webSocketClient.onmessage = this.onClientMessage;
                this.webSocketClient.onerror = this.onClientError;
            }
            catch (err) {
                throw new Error(err);
            }
        };
        this.onClientOpen = () => {
            this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Connected to the Eclair\'s Websocket Server.' });
            this.waitTime = 0.5;
        };
        this.onClientClose = (e) => {
            if (this.common.selectedNode.ln_implementation === 'ECL') {
                this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Web socket disconnected, will reconnect again..' });
                this.reconnet();
            }
        };
        this.onClientMessage = (msg) => {
            this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Received message from the server..', data: msg.data });
            this.wsServer.sendEventsToAllWSClients(msg.data);
        };
        this.onClientError = (err) => {
            this.logger.log({ level: 'ERROR', fileName: 'ECLWebSocket', msg: 'Web socket error', error: err });
            this.wsServer.sendErrorToAllWSClients(err);
            this.reconnet();
        };
        this.disconnect = () => {
            if (this.webSocketClient && this.webSocketClient.readyState === 1) {
                this.logger.log({ level: 'INFO', fileName: 'ECLWebSocket', msg: 'Disconnecting from the Eclair\'s Websocket Server.' });
                this.webSocketClient.close();
            }
        };
    }
}
export const ECLWSClient = new ECLWebSocketClient();

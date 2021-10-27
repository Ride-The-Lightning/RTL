import WebSocket from 'ws';

import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';

export class ECLWebSocketClient {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public wsServer = WSServer;
  public webSocketClient = null;
  public reconnectTimeOut = null;
  public waitTime = 0.5;

  public reconnet = () => {
    if (this.reconnectTimeOut) { return; }
    this.waitTime = (this.waitTime >= 16) ? 16 : (this.waitTime * 2);
    this.reconnectTimeOut = setTimeout(() => {
      this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Reconnecting to the Eclair\'s Websocket Server.' });
      this.connect();
      this.reconnectTimeOut = null;
    }, this.waitTime * 1000);
  };

  public connect = () => {
    try {
      if (!this.webSocketClient || this.webSocketClient.readyState !== WebSocket.OPEN) {
        const UpdatedLNServerURL = this.common.getSelLNServerUrl().replace(/^http/, 'ws');
        const firstSubStrIndex = (UpdatedLNServerURL.indexOf('//') + 2);
        const WS_LINK = UpdatedLNServerURL.slice(0, firstSubStrIndex) + ':' + this.common.selectedNode.ln_api_password + '@' + UpdatedLNServerURL.slice(firstSubStrIndex) + '/ws';
        this.webSocketClient = new WebSocket(WS_LINK);
        this.webSocketClient.onopen = this.onClientOpen;
        this.webSocketClient.onclose = this.onClientClose;
        this.webSocketClient.onmessage = this.onClientMessage;
        this.webSocketClient.onerror = this.onClientError;
      }
    } catch (err) {
      throw new Error(err);
    }
  };

  public onClientOpen = () => {
    this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Connected to the Eclair\'s Websocket Server.' });
    this.waitTime = 0.5;
  };

  public onClientClose = (e) => {
    if (this.common.selectedNode.ln_implementation === 'ECL') {
      this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Web socket disconnected, will reconnect again..' });
      this.webSocketClient.close();
      this.reconnet();
    }
  };

  public onClientMessage = (msg) => {
    this.logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Received message from the server..', data: msg.data });
    this.wsServer.sendEventsToAllWSClients(msg.data);
  };

  public onClientError = (err) => {
    this.logger.log({ level: 'ERROR', fileName: 'ECLWebSocket', msg: 'Web socket error', error: err });
    this.wsServer.sendErrorToAllWSClients(err);
    this.webSocketClient.close();
    this.reconnet();
  };

  public disconnect = () => {
    if (this.webSocketClient && this.webSocketClient.readyState === WebSocket.OPEN) {
      this.logger.log({ level: 'INFO', fileName: 'ECLWebSocket', msg: 'Disconnecting from the Eclair\'s Websocket Server.' });
      this.webSocketClient.close();
    }
  };

}

export const ECLWSClient = new ECLWebSocketClient();

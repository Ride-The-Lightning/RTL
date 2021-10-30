import WebSocket from 'ws';

import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
import { CommonSelectedNode } from '../../models/config.model.js';

export class ECLWebSocketClient {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public wsServer = WSServer;
  public webSocketClient = null;
  public reconnectTimeOut = null;
  public waitTime = 0.5;
  private selectedNode = null;
  private prevMessage = {};

  public reconnet = () => {
    if (this.reconnectTimeOut) { return; }
    this.waitTime = (this.waitTime >= 16) ? 16 : (this.waitTime * 2);
    this.reconnectTimeOut = setTimeout(() => {
      this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Reconnecting to the Eclair\'s Websocket Server.' });
      this.connect(this.selectedNode);
      this.reconnectTimeOut = null;
    }, this.waitTime * 1000);
  };

  public connect = (selectedNode: CommonSelectedNode) => {
    try {
      if (!this.webSocketClient || this.webSocketClient.readyState !== WebSocket.OPEN) {
        if (!this.selectedNode) { this.selectedNode = selectedNode; }
        const UpdatedLNServerURL = (selectedNode.ln_server_url).replace(/^http/, 'ws');
        const firstSubStrIndex = (UpdatedLNServerURL.indexOf('//') + 2);
        const WS_LINK = UpdatedLNServerURL.slice(0, firstSubStrIndex) + ':' + this.selectedNode.ln_api_password + '@' + UpdatedLNServerURL.slice(firstSubStrIndex) + '/ws';
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
    this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Connected to the Eclair\'s Websocket Server.' });
    this.waitTime = 0.5;
  };

  public onClientClose = (e) => {
    if (this.selectedNode.ln_implementation === 'ECL') {
      this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Web socket disconnected, will reconnect again..' });
      this.webSocketClient.close();
      this.reconnet();
    }
  };

  public onClientMessage = (msg) => {
    this.logger.log({ selectedNode: this.selectedNode, level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Received message from the server..', data: msg.data });
    msg = (typeof msg.data === 'string') ? JSON.parse(msg.data) : msg.data;
    msg['source'] = 'ECL';
    const msgStr = JSON.stringify(msg);
    if (this.prevMessage.hasOwnProperty(msg.type) && this.prevMessage[msg.type] === msgStr) { return; }
    this.prevMessage[msg.type] = msgStr;
    this.wsServer.sendEventsToAllWSClients(msgStr);
  };

  public onClientError = (err) => {
    this.logger.log({ selectedNode: this.selectedNode, level: 'ERROR', fileName: 'ECLWebSocket', msg: 'Web socket error', error: err });
    this.wsServer.sendErrorToAllWSClients(err);
    this.webSocketClient.close();
    this.reconnet();
  };

  public disconnect = () => {
    if (this.webSocketClient && this.webSocketClient.readyState === WebSocket.OPEN) {
      this.logger.log({ selectedNode: this.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Disconnecting from the Eclair\'s Websocket Server.' });
      this.webSocketClient.close();
    }
  };

}

export const ECLWSClient = new ECLWebSocketClient();

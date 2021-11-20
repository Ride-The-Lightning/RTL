import * as fs from 'fs';
import { join } from 'path';
import WebSocket from 'ws';

import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
import { CommonSelectedNode } from '../../models/config.model.js';

export class ECLWebSocketClient {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public wsServer = WSServer;
  public webSocketClients: Array<{ selectedNode: CommonSelectedNode, webSocketClient: any }> = [];
  public reconnectTimeOut = null;
  public waitTime = 0.5;

  constructor() {
    this.wsServer.eventEmitterECL.on('CONNECT', (nodeIndex) => {
      this.connect(this.common.findNode(+nodeIndex));
    });
    this.wsServer.eventEmitterECL.on('DISCONNECT', (nodeIndex) => {
      this.disconnect(this.common.findNode(+nodeIndex));
    });
  }

  public reconnet = (eclWsClt) => {
    if (this.reconnectTimeOut) { return; }
    this.waitTime = (this.waitTime >= 64) ? 64 : (this.waitTime * 2);
    this.reconnectTimeOut = setTimeout(() => {
      if (eclWsClt.selectedNode) {
        this.logger.log({ selectedNode: eclWsClt.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Reconnecting to the Eclair\'s Websocket Server..' });
        this.connect(eclWsClt.selectedNode);
      }
      this.reconnectTimeOut = null;
    }, this.waitTime * 1000);
  };

  public connect = (selectedNode: CommonSelectedNode) => {
    try {
      const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode === selectedNode);
      if (!clientExists) {
        if (selectedNode.ln_server_url) {
          const newWebSocketClient = { selectedNode: selectedNode, webSocketClient: null };
          this.connectWithClient(newWebSocketClient);
          this.webSocketClients.push(newWebSocketClient);
        }
      } else {
        if ((!clientExists.webSocketClient || clientExists.webSocketClient.readyState !== WebSocket.OPEN) && selectedNode.ln_server_url) {
          this.connectWithClient(clientExists);
        }
      }
    } catch (err) {
      throw new Error(err);
    }
  };

  public connectWithClient = (eclWsClt) => {
    this.logger.log({ selectedNode: eclWsClt.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Connecting to the Eclair\'s Websocket Server..' });
    const UpdatedLNServerURL = (eclWsClt.selectedNode.ln_server_url).replace(/^http/, 'ws');
    const firstSubStrIndex = (UpdatedLNServerURL.indexOf('//') + 2);
    const WS_LINK = UpdatedLNServerURL.slice(0, firstSubStrIndex) + ':' + eclWsClt.selectedNode.ln_api_password + '@' + UpdatedLNServerURL.slice(firstSubStrIndex) + '/ws';
    eclWsClt.webSocketClient = new WebSocket(WS_LINK);
    eclWsClt.webSocketClient.onopen = () => {
      this.logger.log({ selectedNode: eclWsClt.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Connected to the Eclair\'s Websocket Server..' });
      this.waitTime = 0.5;
    };

    eclWsClt.webSocketClient.onclose = (e) => {
      if (eclWsClt && eclWsClt.selectedNode && eclWsClt.selectedNode.ln_implementation === 'ECL') {
        this.logger.log({ selectedNode: eclWsClt.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Web socket disconnected, will reconnect again...' });
        eclWsClt.webSocketClient.close();
        this.reconnet(eclWsClt);
      }
    };

    eclWsClt.webSocketClient.onmessage = (msg) => {
      this.logger.log({ selectedNode: eclWsClt.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Received message from the server..', data: msg.data });
      msg = (typeof msg.data === 'string') ? JSON.parse(msg.data) : msg.data;
      msg['source'] = 'ECL';
      const msgStr = JSON.stringify(msg);
      this.wsServer.sendEventsToAllWSClients(msgStr);
    };

    eclWsClt.webSocketClient.onerror = (err) => {
      this.logger.log({ selectedNode: eclWsClt.selectedNode, level: 'ERROR', fileName: 'ECLWebSocket', msg: 'Web socket error', error: err });
      this.wsServer.sendErrorToAllWSClients(err);
      eclWsClt.webSocketClient.close();
      this.reconnet(eclWsClt);
    };
  };

  public disconnect = (selectedNode: CommonSelectedNode) => {
    const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode === selectedNode);
    if (clientExists && clientExists.webSocketClient && clientExists.webSocketClient.readyState === WebSocket.OPEN) {
      this.logger.log({ selectedNode: clientExists.selectedNode, level: 'INFO', fileName: 'ECLWebSocket', msg: 'Disconnecting from the Eclair\'s Websocket Server..' });
      clientExists.webSocketClient.close();
      const clientIdx = this.webSocketClients.findIndex((wsc) => wsc.selectedNode === selectedNode);
      this.webSocketClients.splice(clientIdx, 1);
    }
  };

}

export const ECLWSClient = new ECLWebSocketClient();

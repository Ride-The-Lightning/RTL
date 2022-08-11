import * as fs from 'fs';
import { join } from 'path';
import WebSocket from 'ws';

import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
import { CommonSelectedNode } from '../../models/config.model.js';

export class CLWebSocketClient {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public wsServer = WSServer;
  public webSocketClients: Array<{ selectedNode: CommonSelectedNode, reConnect: boolean, webSocketClient: any }> = [];
  public reconnectTimeOut = null;
  public waitTime = 0.5;

  constructor() {
    this.wsServer.eventEmitterCLN.on('CONNECT', (nodeIndex) => {
      this.connect(this.common.findNode(+nodeIndex));
    });
    this.wsServer.eventEmitterCLN.on('DISCONNECT', (nodeIndex) => {
      this.disconnect(this.common.findNode(+nodeIndex));
    });
  }

  public reconnet = (clWsClt) => {
    if (this.reconnectTimeOut) { return; }
    this.waitTime = (this.waitTime >= 64) ? 64 : (this.waitTime * 2);
    this.reconnectTimeOut = setTimeout(() => {
      if (clWsClt.selectedNode) {
        this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Reconnecting to the Core Lightning\'s Websocket Server..' });
        this.connect(clWsClt.selectedNode);
      }
      this.reconnectTimeOut = null;
    }, this.waitTime * 1000);
  };

  public connect = (selectedNode: CommonSelectedNode) => {
    try {
      const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
      if (!clientExists) {
        if (selectedNode.ln_server_url) {
          const newWebSocketClient = { selectedNode: selectedNode, reConnect: true, webSocketClient: null };
          this.connectWithClient(newWebSocketClient);
          this.webSocketClients.push(newWebSocketClient);
        }
      } else {
        if ((!clientExists.webSocketClient || clientExists.webSocketClient.readyState !== WebSocket.OPEN) && selectedNode.ln_server_url) {
          clientExists.reConnect = true;
          this.connectWithClient(clientExists);
        }
      }
    } catch (err) {
      throw new Error(err);
    }
  };

  public connectWithClient = (clWsClt) => {
    this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connecting to the Core Lightning\'s Websocket Server..' });
    const WS_LINK = (clWsClt.selectedNode.ln_server_url).replace(/^http/, 'ws') + '/v1/ws';
    const mcrnHexEncoded = Buffer.from(fs.readFileSync(join(clWsClt.selectedNode.macaroon_path, 'access.macaroon'))).toString('hex');
    clWsClt.webSocketClient = new WebSocket(WS_LINK, [mcrnHexEncoded, 'hex'], { rejectUnauthorized: false });

    clWsClt.webSocketClient.onopen = () => {
      this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Connected to the Core Lightning\'s Websocket Server..' });
      this.waitTime = 0.5;
    };

    clWsClt.webSocketClient.onclose = (e) => {
      if (clWsClt && clWsClt.selectedNode && clWsClt.selectedNode.ln_implementation === 'CLN') {
        this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Web socket disconnected, will reconnect again...' });
        clWsClt.webSocketClient.close();
        if (clWsClt.reConnect) { this.reconnet(clWsClt); }
      }
    };

    clWsClt.webSocketClient.onmessage = (msg) => {
      this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'DEBUG', fileName: 'CLWebSocket', msg: 'Received message from the server..', data: msg.data });
      msg = (typeof msg.data === 'string') ? JSON.parse(msg.data) : msg.data;
      msg['source'] = 'CLN';
      const msgStr = JSON.stringify(msg);
      this.wsServer.sendEventsToAllLNClients(msgStr, clWsClt.selectedNode);
    };

    clWsClt.webSocketClient.onerror = (err) => {
      if (clWsClt.selectedNode.api_version === '' || !clWsClt.selectedNode.api_version || this.common.isVersionCompatible(clWsClt.selectedNode.api_version, '0.6.0')) {
        this.logger.log({ selectedNode: clWsClt.selectedNode, level: 'ERROR', fileName: 'CLWebSocket', msg: 'Web socket error', error: err });
        const errStr = ((typeof err === 'object' && err.message) ? JSON.stringify({ error: err.message }) : (typeof err === 'object') ? JSON.stringify({ error: err }) : ('{ "error": ' + err + ' }'));
        this.wsServer.sendErrorToAllLNClients(errStr, clWsClt.selectedNode);
        clWsClt.webSocketClient.close();
        if (clWsClt.reConnect) { this.reconnet(clWsClt); }
      } else {
        clWsClt.reConnect = false;
      }
    };
  };

  public disconnect = (selectedNode: CommonSelectedNode) => {
    const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
    if (clientExists && clientExists.webSocketClient && clientExists.webSocketClient.readyState === WebSocket.OPEN) {
      this.logger.log({ selectedNode: clientExists.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Disconnecting from the Core Lightning\'s Websocket Server..' });
      clientExists.reConnect = false;
      clientExists.webSocketClient.close();
      const clientIdx = this.webSocketClients.findIndex((wsc) => wsc.selectedNode.index === selectedNode.index);
      this.webSocketClients.splice(clientIdx, 1);
    }
  };

  public updateSelectedNode = (newSelectedNode: CommonSelectedNode) => {
    const clientIdx = this.webSocketClients.findIndex((wsc) => +wsc.selectedNode.index === +newSelectedNode.index);
    let newClient = this.webSocketClients[clientIdx];
    if (!newClient) { newClient = { selectedNode: null, reConnect: true, webSocketClient: null }; }
    newClient.selectedNode = JSON.parse(JSON.stringify(newSelectedNode));
    this.webSocketClients[clientIdx] = newClient;
  };

}

export const CLWSClient = new CLWebSocketClient();

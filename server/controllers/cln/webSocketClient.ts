import socketIOClient from 'socket.io-client';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
import { SelectedNode } from '../../models/config.model.js';

export class CLWebSocketClient {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public wsServer = WSServer;
  public webSocketClients: Array<{ selectedNode: SelectedNode, reConnect: boolean, webSocketClient: any }> = [];
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

  public reconnect = (clWsClt) => {
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

  public connect = (selectedNode: SelectedNode) => {
    try {
      const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
      if (!clientExists) {
        if (selectedNode.settings.lnServerUrl) {
          const newWebSocketClient = { selectedNode: selectedNode, reConnect: true, webSocketClient: null };
          this.connectWithClient(newWebSocketClient);
          this.webSocketClients.push(newWebSocketClient);
        }
      } else {
        if ((!clientExists.webSocketClient || !clientExists.webSocketClient.connected) && selectedNode.settings.lnServerUrl) {
          clientExists.reConnect = true;
          this.connectWithClient(clientExists);
        }
      }
    } catch (err: any) {
      throw new Error(err);
    }
  };

  public connectWithClient = (clWsClt) => {
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
    } catch (err) {
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
        if (clWsClt.reConnect) { this.reconnect(clWsClt); }
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
      if (clWsClt.reConnect) { this.reconnect(clWsClt); }
    });
  };

  public disconnect = (selectedNode: SelectedNode) => {
    const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
    if (clientExists && clientExists.webSocketClient && clientExists.webSocketClient.connected) {
      this.logger.log({ selectedNode: clientExists.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Disconnecting from the Core Lightning\'s Websocket Server..' });
      clientExists.reConnect = false;
      clientExists.webSocketClient.close();
      const clientIdx = this.webSocketClients.findIndex((wsc) => wsc.selectedNode.index === selectedNode.index);
      this.webSocketClients.splice(clientIdx, 1);
    }
  };

  public updateSelectedNode = (newSelectedNode: SelectedNode) => {
    const clientIdx = this.webSocketClients.findIndex((wsc) => +wsc.selectedNode.index === +newSelectedNode.index);
    let newClient = this.webSocketClients[clientIdx];
    if (!newClient) { newClient = { selectedNode: null, reConnect: true, webSocketClient: null }; }
    newClient.selectedNode = JSON.parse(JSON.stringify(newSelectedNode));
    this.webSocketClients[clientIdx] = newClient;
  };

}

export const CLWSClient = new CLWebSocketClient();

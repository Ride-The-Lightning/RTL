import * as crypto from 'crypto';
import WebSocket from 'ws';
import { Application } from 'express';
import { Logger, LoggerService } from './logger.js';
import { Common, CommonService } from './common.js';
import { verifyWSUser } from './authCheck.js';

export class WebSocketServer {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public webSocketServer = null;

  public pingInterval = setInterval(() => {
    if (this.webSocketServer.clients.size && this.webSocketServer.clients.size > 0) {
      this.webSocketServer.clients.forEach((client) => {
        if (client.isAlive === false) { return client.terminate(); }
        client.isAlive = false;
        client.ping();
      });
    }
  }, 1000 * 60 * 60); // Terminate broken connections every an hour

  public mount = (httpServer: Application): Application => {
    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Connecting Websocket Server.' });
    this.webSocketServer = new WebSocket.Server({ noServer: true, path: this.common.baseHref + '/api/ws', verifyClient: (process.env.NODE_ENV === 'development') ? null : verifyWSUser });
    httpServer.on('upgrade', (request, socket, head) => {
      if (request.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
      }
      const acceptKey = request.headers['sec-websocket-key'];
      const hash = this.generateAcceptValue(acceptKey);
      const responseHeaders = ['HTTP/1.1 101 Web Socket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade', 'Sec-WebSocket-Accept: ' + hash];
      const protocols = !request.headers['sec-websocket-protocol'] ? [] : request.headers['sec-websocket-protocol'].split(',').map((s) => s.trim());
      if (protocols.includes('json')) { responseHeaders.push('Sec-WebSocket-Protocol: json'); }
      this.webSocketServer.handleUpgrade(request, socket, head, this.upgradeCallback);
    });
    this.webSocketServer.on('connection', this.mountEventsOnConnection);
    this.webSocketServer.on('close', () => clearInterval(this.pingInterval));
  }

  public upgradeCallback = (websocket, request) => {
    this.webSocketServer.emit('connection', websocket, request);
  };

  public mountEventsOnConnection = (websocket, request) => {
    websocket.clientId = Date.now();
    websocket.isAlive = true;
    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Connected: ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size });
    websocket.on('error', this.sendErrorToAllWSClients);
    websocket.on('message', this.sendEventsToAllWSClients);
    websocket.on('pong', () => { websocket.isAlive = true; });
    websocket.on('close', () => {
      this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Disconnected: ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size });
    });
  };

  public sendErrorToClient = (client, serverError) => {
    try {
      this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Sending error to client...: ' + JSON.stringify(serverError) });
      client.send(JSON.stringify({ error: serverError }));
      client.close();
    } catch (err) {
      this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while sending error: ' + JSON.stringify(err) });
    }
  };

  public sendErrorToAllWSClients = (serverError) => {
    try {
      this.webSocketServer.clients.forEach((client) => {
        this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Broadcasting error to clients...: ' + JSON.stringify(serverError) });
        client.send(JSON.stringify({ error: serverError }));
      });
    } catch (err) {
      this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
    }
  };

  public sendEventsToAllWSClients = (newMessage) => {
    try {
      this.webSocketServer.clients.forEach((client) => {
        this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Broadcasting message to client...: ' + client.clientId });
        client.send(newMessage);
      });
    } catch (err) {
      this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
    }
  };

  public generateAcceptValue = (acceptKey) => crypto.createHash('sha1').update(acceptKey + crypto.randomBytes(64).toString('hex')).digest('base64');

}

export const WSServer = new WebSocketServer();


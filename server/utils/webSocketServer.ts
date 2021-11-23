import * as cookie from 'cookie';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import WebSocket from 'ws';
import { Application } from 'express';
import { Logger, LoggerService } from './logger.js';
import { Common, CommonService } from './common.js';
import { verifyWSUser } from './authCheck.js';
import { EventEmitter } from 'events';
import { CommonSelectedNode } from '../models/config.model.js';

export class WebSocketServer {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public clientDetails: Array<{ index: number, sessionIds: Array<string> }> = [];
  public eventEmitterCLT = new EventEmitter();
  public eventEmitterECL = new EventEmitter();
  // public eventEmitterLND = new EventEmitter();
  public webSocketServer = null;

  public pingInterval = setInterval(() => {
    if (this.webSocketServer.clients.size && this.webSocketServer.clients.size > 0) {
      this.webSocketServer.clients.forEach((client) => {
        if (client.isAlive === false) {
          this.updateLNWSClientDetails(client.sessionId, -1, client.clientNodeIndex);
          return client.terminate();
        }
        client.isAlive = false;
        client.ping();
      });
    }
  }, 1000 * 60 * 60); // Terminate broken connections every hour

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
    const protocols = !request.headers['sec-websocket-protocol'] ? [] : request.headers['sec-websocket-protocol'].split(',').map((s) => s.trim());
    const cookies = cookie.parse(request.headers.cookie);
    websocket.clientId = Date.now();
    websocket.isAlive = true;
    websocket.sessionId = cookieParser.signedCookie(cookies['connect.sid'], this.common.secret_key);
    websocket.clientNodeIndex = protocols[1];
    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Connected: ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size });
    websocket.on('error', this.sendErrorToAllLNClient);
    websocket.on('message', this.sendEventsToAllLNClient);
    websocket.on('pong', () => { websocket.isAlive = true; });
    websocket.on('close', () => {
      this.updateLNWSClientDetails(websocket.sessionId, -1, websocket.clientNodeIndex);
      this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Disconnected: ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size });
    });
  };

  public updateLNWSClientDetails = (sessionId: string, currNodeIndex: number, prevNodeIndex: number) => {
    if (prevNodeIndex >= 0 && currNodeIndex >= 0) {
      this.webSocketServer.clients.forEach((client) => {
        if (client.sessionId === sessionId) {
          client.clientNodeIndex = currNodeIndex;
        }
      });
      this.disconnectFromNodeClient(sessionId, prevNodeIndex);
      this.connectToNodeClient(sessionId, currNodeIndex);
    } else if (prevNodeIndex >= 0 && currNodeIndex < 0) {
      this.disconnectFromNodeClient(sessionId, prevNodeIndex);
    } else if (prevNodeIndex < 0 && currNodeIndex >= 0) {
      this.connectToNodeClient(sessionId, currNodeIndex);
    } else {
      const selectedNode = this.common.findNode(currNodeIndex);
      this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Invalid Node Selection. Previous and current node indices can not be less than zero.' });
    }
  }

  public disconnectFromNodeClient = (sessionId: string, prevNodeIndex: number) => {
    const foundClient = this.clientDetails.find((clientDetail) => clientDetail.index === +prevNodeIndex);
    if (foundClient) {
      const foundSessionIdx = foundClient.sessionIds.findIndex((sid) => sid === sessionId);
      if (foundSessionIdx > -1) {
        foundClient.sessionIds.splice(foundSessionIdx, 1);
      }
      if (foundClient.sessionIds.length === 0) {
        const foundClientIdx = this.clientDetails.findIndex((clientDetail) => clientDetail.index === +prevNodeIndex);
        this.clientDetails.splice(foundClientIdx, 1);
        const prevSelectedNode = this.common.findNode(prevNodeIndex);
        if (prevSelectedNode && prevSelectedNode.ln_implementation) {
          switch (prevSelectedNode.ln_implementation) {
            case 'CLT':
              this.eventEmitterCLT.emit('DISCONNECT', prevNodeIndex);
              break;
            case 'ECL':
              this.eventEmitterECL.emit('DISCONNECT', prevNodeIndex);
              break;
            default:
              break;
          }
        }
      }
    }
  }

  public connectToNodeClient = (sessionId: string, currNodeIndex: number) => {
    let foundClient = this.clientDetails.find((clientDetail) => clientDetail.index === +currNodeIndex);
    if (foundClient) {
      const foundSessionIdx = foundClient.sessionIds.findIndex((sid) => sid === sessionId);
      if (foundSessionIdx < 0) {
        foundClient.sessionIds.push(sessionId);
      }
    } else {
      const currSelectedNode = this.common.findNode(currNodeIndex);
      foundClient = { index: currNodeIndex, sessionIds: [sessionId] };
      this.clientDetails.push(foundClient);
      if (currSelectedNode && currSelectedNode.ln_implementation) {
        switch (currSelectedNode.ln_implementation) {
          case 'CLT':
            this.eventEmitterCLT.emit('CONNECT', currNodeIndex);
            break;
          case 'ECL':
            this.eventEmitterECL.emit('CONNECT', currNodeIndex);
            break;
          default:
            break;
        }
      }
    }
  }

  public sendErrorToAllLNClient = (serverError, selectedNode: CommonSelectedNode) => {
    try {
      this.webSocketServer.clients.forEach((client) => {
        const serverErrorStr = ((typeof serverError === 'object' && serverError.message) ? JSON.stringify(serverError.message) : (typeof serverError === 'object') ? JSON.stringify(serverError) : serverError);
        this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Broadcasting error to clients...: ' + serverErrorStr });
        if (+client.clientNodeIndex === +selectedNode.index) {
          client.send('{ error: ' + serverErrorStr + '}');
        }
      });
    } catch (err) {
      this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
    }
  };

  public sendEventsToAllLNClient = (newMessage, selectedNode: CommonSelectedNode) => {
    try {
      this.webSocketServer.clients.forEach((client) => {
        if (+client.clientNodeIndex === +selectedNode.index) {
          this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Broadcasting message to client...: ' + client.clientId });
          client.send(newMessage);
        }
      });
    } catch (err) {
      this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
    }
  };

  public generateAcceptValue = (acceptKey) => crypto.createHash('sha1').update(acceptKey + crypto.randomBytes(64).toString('hex')).digest('base64');

  public getClients = () => this.webSocketServer.clients;

}

export const WSServer = new WebSocketServer();


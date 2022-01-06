import { parse } from 'cookie';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import WebSocket from 'ws';
import { Logger } from './logger.js';
import { Common } from './common.js';
import { verifyWSUser } from './authCheck.js';
import { EventEmitter } from 'events';
export class WebSocketServer {
    constructor() {
        this.logger = Logger;
        this.common = Common;
        this.clientDetails = [];
        this.eventEmitterCLT = new EventEmitter();
        this.eventEmitterECL = new EventEmitter();
        this.eventEmitterLND = new EventEmitter();
        this.webSocketServer = null;
        this.pingInterval = setInterval(() => {
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
        this.mount = (httpServer) => {
            this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Connecting Websocket Server..' });
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
                if (protocols.includes('json')) {
                    responseHeaders.push('Sec-WebSocket-Protocol: json');
                }
                // socket.write(responseHeaders.join('\r\n') + '\r\n\r\n');
                this.webSocketServer.handleUpgrade(request, socket, head, this.upgradeCallback);
            });
            this.webSocketServer.on('connection', this.mountEventsOnConnection);
            this.webSocketServer.on('close', () => clearInterval(this.pingInterval));
        };
        this.upgradeCallback = (websocket, request) => {
            this.webSocketServer.emit('connection', websocket, request);
        };
        this.mountEventsOnConnection = (websocket, request) => {
            const protocols = !request.headers['sec-websocket-protocol'] ? [] : request.headers['sec-websocket-protocol'].split(',').map((s) => s.trim());
            const cookies = parse(request.headers.cookie);
            websocket.clientId = Date.now();
            websocket.isAlive = true;
            websocket.sessionId = cookieParser.signedCookie(cookies['connect.sid'], this.common.secret_key);
            websocket.clientNodeIndex = +protocols[1];
            this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Connected: ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size });
            websocket.on('error', this.sendErrorToAllLNClients);
            websocket.on('message', this.sendEventsToAllLNClients);
            websocket.on('pong', () => { websocket.isAlive = true; });
            websocket.on('close', (code, reason) => {
                this.updateLNWSClientDetails(websocket.sessionId, -1, websocket.clientNodeIndex);
                this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Disconnected due to ' + code + ' : ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size });
            });
        };
        this.updateLNWSClientDetails = (sessionId, currNodeIndex, prevNodeIndex) => {
            if (prevNodeIndex >= 0 && currNodeIndex >= 0) {
                this.webSocketServer.clients.forEach((client) => {
                    if (client.sessionId === sessionId) {
                        client.clientNodeIndex = currNodeIndex;
                    }
                });
                this.disconnectFromNodeClient(sessionId, prevNodeIndex);
                this.connectToNodeClient(sessionId, currNodeIndex);
            }
            else if (prevNodeIndex >= 0 && currNodeIndex < 0) {
                this.disconnectFromNodeClient(sessionId, prevNodeIndex);
            }
            else if (prevNodeIndex < 0 && currNodeIndex >= 0) {
                this.connectToNodeClient(sessionId, currNodeIndex);
            }
            else {
                const selectedNode = this.common.findNode(currNodeIndex);
                this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Invalid Node Selection. Previous and current node indices can not be less than zero.' });
            }
        };
        this.disconnectFromNodeClient = (sessionId, prevNodeIndex) => {
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
                            case 'LND':
                                this.eventEmitterLND.emit('DISCONNECT', prevNodeIndex);
                                break;
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
        };
        this.connectToNodeClient = (sessionId, currNodeIndex) => {
            let foundClient = this.clientDetails.find((clientDetail) => clientDetail.index === +currNodeIndex);
            if (foundClient) {
                const foundSessionIdx = foundClient.sessionIds.findIndex((sid) => sid === sessionId);
                if (foundSessionIdx < 0) {
                    foundClient.sessionIds.push(sessionId);
                }
            }
            else {
                const currSelectedNode = this.common.findNode(currNodeIndex);
                foundClient = { index: currNodeIndex, sessionIds: [sessionId] };
                this.clientDetails.push(foundClient);
                if (currSelectedNode && currSelectedNode.ln_implementation) {
                    switch (currSelectedNode.ln_implementation) {
                        case 'LND':
                            this.eventEmitterLND.emit('CONNECT', currNodeIndex);
                            break;
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
        };
        this.sendErrorToAllLNClients = (serverError, selectedNode) => {
            try {
                this.webSocketServer.clients.forEach((client) => {
                    this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Broadcasting error to clients...: ' + serverError });
                    if (+client.clientNodeIndex === +selectedNode.index) {
                        client.send(serverError);
                    }
                });
            }
            catch (err) {
                this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
            }
        };
        this.sendEventsToAllLNClients = (newMessage, selectedNode) => {
            try {
                this.webSocketServer.clients.forEach((client) => {
                    if (+client.clientNodeIndex === +selectedNode.index) {
                        this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'INFO', fileName: 'WebSocketServer', msg: 'Broadcasting message to client...: ' + client.clientId });
                        client.send(newMessage);
                    }
                });
            }
            catch (err) {
                this.logger.log({ selectedNode: !selectedNode ? this.common.initSelectedNode : selectedNode, level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
            }
        };
        this.generateAcceptValue = (acceptKey) => crypto.createHash('sha1').update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary').digest('base64');
        this.getClients = () => this.webSocketServer.clients;
    }
}
export const WSServer = new WebSocketServer();

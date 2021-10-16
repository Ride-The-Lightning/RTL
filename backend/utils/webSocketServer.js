import * as crypto from 'crypto';
import WebSocket from 'ws';
import { Logger } from './logger.js';
import { Common } from './common.js';
import { verifyWSUser } from './authCheck.js';
class WebSocketServer {
    constructor() {
        this.logger = Logger;
        this.common = Common;
        this.webSocketServer = null;
        this.mount = (httpServer) => {
            this.logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Connecting Websocket Server.' });
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
                this.webSocketServer.handleUpgrade(request, socket, head, this.upgradeCallback);
            });
            this.webSocketServer.on('connection', this.mountEventsOnConnection);
        };
        this.upgradeCallback = (websocket, request) => {
            this.webSocketServer.emit('connection', websocket, request);
        };
        this.mountEventsOnConnection = (websocket, request) => {
            websocket.clientId = Date.now();
            this.logger.log({ level: 'INFO', fileName: 'WebSocketServer', msg: 'Connected: ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size });
            websocket.on('error', this.sendErrorToAllWSClients);
            websocket.on('message', this.sendEventsToAllWSClients);
            websocket.on('close', () => { this.logger.log({ level: 'INFO', fileName: 'WebSocketServer', msg: 'Disconnected: ' + websocket.clientId + ', Total WS clients: ' + this.webSocketServer.clients.size }); });
        };
        this.sendErrorToClient = (client, serverError) => {
            try {
                this.logger.log({ level: 'ERROR', fileName: 'WebSocketServer', msg: 'Sending error to client...: ' + JSON.stringify(serverError) });
                client.send(JSON.stringify({ error: serverError }));
                client.close();
            }
            catch (err) {
                this.logger.log({ level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while sending error: ' + JSON.stringify(err) });
            }
        };
        this.sendErrorToAllWSClients = (serverError) => {
            try {
                this.webSocketServer.clients.forEach((client) => {
                    this.logger.log({ level: 'ERROR', fileName: 'WebSocketServer', msg: 'Broadcasting error to clients...: ' + JSON.stringify(serverError) });
                    client.send(JSON.stringify({ error: serverError }));
                });
            }
            catch (err) {
                this.logger.log({ level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
            }
        };
        this.sendEventsToAllWSClients = (newMessage) => {
            try {
                this.webSocketServer.clients.forEach((client) => {
                    this.logger.log({ level: 'INFO', fileName: 'WebSocketServer', msg: 'Broadcasting message to client...: ' + client.clientId });
                    client.send(newMessage);
                });
            }
            catch (err) {
                this.logger.log({ level: 'ERROR', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
            }
        };
        this.generateAcceptValue = (acceptKey) => crypto.createHash('sha1').update(acceptKey + crypto.randomBytes(64).toString('hex')).digest('base64');
    }
}
export default WebSocketServer;

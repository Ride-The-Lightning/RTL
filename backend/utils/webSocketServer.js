"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnectionError = exports.handleConnection = exports.handleUpgrade = exports.sendEventsToAllWSClients = exports.generateAcceptValue = exports.plugIn = void 0;
const crypto = require("crypto");
const WebSocket = require("ws");
const logger_1 = require("./logger");
const authCheck_1 = require("./authCheck");
const logger = logger_1.Logger;
let webSocketServer;
const plugIn = (expressServer) => {
    logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Connecting Websocket Server.' });
    webSocketServer = new WebSocket.Server({ noServer: true, path: '/api/ws', verifyClient: authCheck_1.isAuthenticated });
    expressServer.on('upgrade', exports.handleUpgrade);
    webSocketServer.on('connection', exports.handleConnection);
    return expressServer;
};
exports.plugIn = plugIn;
const generateAcceptValue = (acceptKey) => crypto.createHash('sha1').update(acceptKey + crypto.randomBytes(64).toString('hex')).digest('base64');
exports.generateAcceptValue = generateAcceptValue;
// public generateAcceptValue = (acceptKey) => crypto.createHash('sha1').update(acceptKey + crypto.randomBytes(64).toString('hex'), 'binary').digest('base64');
const sendEventsToAllWSClients = (eventType, newMessage) => {
    webSocketServer.clients.forEach((client) => {
        try {
            logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Broadcasting message to client...: ' + client.clientId });
            if (eventType === 'Error') {
                client.send('Error: ' + newMessage);
            }
            else {
                client.send(newMessage);
            }
        }
        catch (err) {
            logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Error while broadcasting message: ' + JSON.stringify(err) });
        }
    });
};
exports.sendEventsToAllWSClients = sendEventsToAllWSClients;
const handleUpgrade = (request, socket, head) => {
    if (request.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }
    const acceptKey = request.headers['sec-websocket-key'];
    const hash = exports.generateAcceptValue(acceptKey);
    const responseHeaders = ['HTTP/1.1 101 Web Socket Protocol Handshake', 'Upgrade: WebSocket', 'Connection: Upgrade', `Sec-WebSocket-Accept: ${hash}`];
    const protocol = request.headers['sec-websocket-protocol'];
    const protocols = !protocol ? [] : protocol.split(',').map((s) => s.trim());
    if (protocols.includes('json')) {
        responseHeaders.push('Sec-WebSocket-Protocol: json');
    }
    webSocketServer.handleUpgrade((request, socket, head) => {
        webSocketServer.emit('connection', socket, request);
    });
};
exports.handleUpgrade = handleUpgrade;
const handleConnection = (socket) => {
    socket.clientId = Date.now();
    logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Connected: ' + socket.clientId + ', Total WS clients: ' + webSocketServer.clients.size });
    socket.on('close', () => {
        logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Disconnected: ' + socket.clientId + ', Total WS clients: ' + webSocketServer.clients.size });
    });
    socket.on('error', exports.handleConnectionError.bind(socket));
};
exports.handleConnection = handleConnection;
const handleConnectionError = (socket, serverError) => {
    logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Broadcasting error to clients...: ' + JSON.stringify(serverError) });
    try {
        socket.send(JSON.stringify({ error: (typeof serverError === 'string' ? serverError : JSON.stringify(serverError)) }));
    }
    catch (err) {
        logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Error while broadcasting error: ' + JSON.stringify(err) });
    }
};
exports.handleConnectionError = handleConnectionError;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEventControl = exports.testRxjsScheduler = exports.connect = exports.reconnet = void 0;
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
const logger = logger_1.Logger;
const common = common_1.Common;
const WS_LINK = 'ws://user:' + common.selectedNode.ln_api_password + '@' + common.getSelLNServerUrl() + '/ws';
let reconnectTimeOut = null;
let waitTime = 0.5;
const reconnet = () => {
    if (reconnectTimeOut) {
        return;
    }
    waitTime = (waitTime >= 16) ? 16 : (waitTime * 2);
    reconnectTimeOut = setTimeout(() => {
        logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Reconnecting to the Eclair\'s Websocket Server.' });
        exports.connect();
        reconnectTimeOut = null;
    }, waitTime * 1000);
};
exports.reconnet = reconnet;
const connect = () => {
    exports.testRxjsScheduler();
    logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Connecting to the Eclair\'s Websocket Server.' });
    const webSocketClient = new WebSocket(WS_LINK);
    webSocketClient.onopen = () => {
        logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Connected to the Eclair\'s Websocket Server.' });
        waitTime = 0.5;
    };
    webSocketClient.onmessage = (msg) => {
        logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Received message from the server..', data: msg.data });
        // sendEventsToAllWSClients('Data', msg.data);
        // sendEventsToAllSSEClients('Data', msg.data);
    };
    webSocketClient.onclose = (e) => {
        logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Web socket disconnected, will reconnect again..' });
        exports.reconnet();
    };
    webSocketClient.onerror = (err) => {
        logger.log({ level: 'ERROR', fileName: 'ECLWebSocket', msg: 'Web socket error', error: err });
        // sendEventsToAllWSClients('Error', err.error);
        // sendEventsToAllSSEClients('Error', err.error);
        exports.reconnet();
    };
};
exports.connect = connect;
/* eslint-disable no-console */
const testRxjsScheduler = () => {
    const observable = new rxjs_1.Observable((observer) => {
        observer.next(1);
        observer.next(2);
        observer.next(3);
        observer.complete();
    }).pipe(operators_1.observeOn(rxjs_1.asyncScheduler));
    console.log('just before subscribe');
    observable.subscribe({
        next(x) {
            console.log('got value ' + x);
        },
        error(err) {
            console.error('something wrong occurred: ' + err);
        },
        complete() {
            console.log('done');
        }
    });
    console.log('just after subscribe');
};
exports.testRxjsScheduler = testRxjsScheduler;
let clients = [];
const SSEventControl = (req, res, next) => {
    exports.connect();
    const headers = { 'Content-Type': 'text/event-stream', Connection: 'keep-alive', 'Cache-Control': 'no-cache' };
    res.writeHead(200, headers);
    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);
    console.log('Connected: ' + clientId + ', Total SSE clients: ' + clients.length);
    req.on('close', () => {
        clients = clients.filter((client) => client.id !== clientId);
        console.log('Disconnected: ' + clientId + ', Total SSE clients: ' + clients.length);
    });
};
exports.SSEventControl = SSEventControl;

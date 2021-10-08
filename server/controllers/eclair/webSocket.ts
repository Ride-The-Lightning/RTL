import { Observable, asyncScheduler } from 'rxjs';
import { observeOn } from 'rxjs/operators';

import { Logger, LoggerService } from '../../utils/logger';
import { Common, CommonService } from '../../utils/common';

const logger: LoggerService = Logger;
const common: CommonService = Common;
const WS_LINK = 'ws://user:' + common.selectedNode.ln_api_password + '@' + common.getSelLNServerUrl() + '/ws';
let reconnectTimeOut = null;
let waitTime = 0.5;

export const reconnet = () => {
  if (reconnectTimeOut) { return; }
  waitTime = (waitTime >= 16) ? 16 : (waitTime * 2);
  reconnectTimeOut = setTimeout(() => {
    logger.log({ level: 'DEBUG', fileName: 'ECLWebSocket', msg: 'Reconnecting to the Eclair\'s Websocket Server.' });
    connect();
    reconnectTimeOut = null;
  }, waitTime * 1000);
};

export const connect = () => {
  testRxjsScheduler();
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
    reconnet();
  };

  webSocketClient.onerror = (err) => {
    logger.log({ level: 'ERROR', fileName: 'ECLWebSocket', msg: 'Web socket error', error: err });
    // sendEventsToAllWSClients('Error', err.error);
    // sendEventsToAllSSEClients('Error', err.error);
    reconnet();
  };
};

/* eslint-disable no-console */
export const testRxjsScheduler = () => {
  const observable = new Observable((observer) => {
    observer.next(1);
    observer.next(2);
    observer.next(3);
    observer.complete();
  }).pipe(
    observeOn(asyncScheduler)
  );

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

let clients = [];
export const SSEventControl = (req, res, next) => {
  connect();
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

import WebSocket from 'ws';
import { Application } from 'express';
import { Logger, LoggerService } from './logger.js';

class WebSocketServer {

  public logger: LoggerService = Logger;

  public mount = (httpServer: Application): Application => {
    this.logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Connecting Websocket Server.' });
    const webSocketServer = new WebSocket.Server({ noServer: true, path: '/api/ws' });
    httpServer.on('upgrade', (request, socket, head) => {
      webSocketServer.handleUpgrade(request, socket, head, (cb) => {
        webSocketServer.emit('connection', socket, request);
      });
    });
  }

}

export default WebSocketServer;

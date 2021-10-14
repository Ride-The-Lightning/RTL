import WebSocket from 'ws';
import { Logger } from './logger.js';
class WebSocketServer {
    constructor() {
        this.logger = Logger;
        this.mount = (httpServer) => {
            this.logger.log({ level: 'DEBUG', fileName: 'WebSocketServer', msg: 'Connecting Websocket Server.' });
            const webSocketServer = new WebSocket.Server({ noServer: true, path: '/api/ws' });
            httpServer.on('upgrade', (request, socket, head) => {
                webSocketServer.handleUpgrade(request, socket, head, (cb) => {
                    webSocketServer.emit('connection', socket, request);
                });
            });
        };
    }
}
export default WebSocketServer;

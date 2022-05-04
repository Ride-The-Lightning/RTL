import http from 'http';
import App from './backend/utils/app.js';
import { Logger } from './backend/utils/logger.js';
import { Common } from './backend/utils/common.js';
import { WSServer } from './backend/utils/webSocketServer.js';

const logger = Logger;
const common = Common;
const wsServer = WSServer;
const app = new App();

const onError = (error) => {
  if (error.syscall !== 'listen') { throw error; }
  switch (error.code) {
    case 'EACCES':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'http://' + (common.host ? common.host : 'localhost') + ':' + common.port + ' requires elevated privileges' });
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'http://' + (common.host ? common.host : 'localhost') + ':' + common.port + ' is already in use' });
      process.exit(1);
      break;
    case 'ECONNREFUSED':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'Server is down/locked' });
      process.exit(1);
      break;
    case 'EBADCSRFTOKEN':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'Form tempered' });
      process.exit(1);
      break;
    default:
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'DEFUALT ERROR', error: error.code });
      throw error;
  }
};

const onListening = () => {
  logger.log({ level: 'INFO', fileName: 'RTL', msg: 'Server is up and running, please open the UI at http://' + (common.host ? common.host : 'localhost') + ':' + common.port + ' or your proxy configured url' });
};

let server = http.createServer(app.getApp());

server.on('error', onError);
server.on('listening', onListening);

wsServer.mount(server);

if (common.host) {
  server.listen(common.port, common.host);
} else {
  server.listen(common.port);
}

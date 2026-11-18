import http from 'http';
import { Logger } from './backend/utils/logger.js';
import { Common } from './backend/utils/common.js';
import { Config } from './backend/utils/config.js'; // Follow sequence to set server configuration in time
import { WSServer } from './backend/utils/webSocketServer.js';
import App from './backend/utils/app.js';


const logger = Logger;
const common = Common;
const wsServer = WSServer;
const app = new App();

process.on('SIGINT', () => {
  process.exit();
});

// What a failed listen was for. With no host RTL asks for every interface, so naming localhost would mislead (issue #731).
const listenTarget = () => ((common.host && common.host !== '') ? 'http://' + (common.host.includes(':') ? '[' + common.host + ']' : common.host) + ':' + common.port : 'Port ' + common.port);

const onError = (error) => {
  if (error.syscall !== 'listen') { throw error; }
  switch (error.code) {
    case 'EACCES':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: listenTarget() + ' requires elevated privileges' });
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: listenTarget() + ' is already in use' });
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
  logger.log({ level: 'INFO', fileName: 'RTL', msg: common.getListeningMessage(server.address(), common.host) });
};

let server = http.createServer(app.getApp());

server.on('error', onError);
server.on('listening', onListening);

wsServer.mount(server);

if (common.host && common.host !== '') {
  server.listen(common.port, common.host);
} else {
  server.listen(common.port);
}

const http = require('http');
const app = require('./backend/utils/app');
const common = require('./backend/utils/common').Common;
const config = require('./backend/utils/config').Config;
const logger = require('./backend/utils/logger').Logger;

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
  logger.log({ level: 'INFO', fileName: 'RTL', msg: 'Server is up and running, please open the UI at http://' + (common.host ? common.host : 'localhost') + ':' + common.port });
};

config.setServerConfiguration();

const server = http.createServer(app.default);

server.on('error', onError);
server.on('listening', onListening);

if (common.host) {
    server.listen(common.port, common.host);
}
else {
    server.listen(common.port);
}

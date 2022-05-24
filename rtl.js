import http from 'http';
import https from 'https';
import App from './backend/utils/app.js';
import { Logger } from './backend/utils/logger.js';
import { Common } from './backend/utils/common.js';
import { WSServer } from './backend/utils/webSocketServer.js';
import SSL from './backend/utils/ssl.js';

const logger = Logger;
const common = Common;
const wsServer = WSServer;
const app = new App();
const appInstance = app.getApp();
//Change 'global' to '127.0.0.1' for breaking change version release
const hostUndefined = common.host ? false : true;
const resolvedHost = hostUndefined ? 'global' : common.host; //'127.0.0.1' <-- this will become new default someday. swap with 'global' for breaking change
const resolvedPort = common.port;
const tcpModule = common.ssl ? https : http;
const fullUrl = `${common.ssl ? 'https' : 'http'}://${(hostUndefined || resolvedHost === 'global') ? 'localhost' : resolvedHost}:${resolvedPort}`;

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  switch (error.code) {
    case 'EACCES':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: `${fullUrl} requires elevated privileges` });
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.log({ level: 'ERROR', fileName: 'RTL', msg: `${fullUrl} is already in use` });
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
  logger.log({ level: 'INFO', fileName: 'RTL', msg: `Server is up and running, please open the UI at ${fullUrl}` });
  //Remove the following IF block after sufficient version releases for users to update configs
  if (hostUndefined) {
    logger.log({
      level: 'WARN',
      fileName: 'RTL',
      msg: `DEPRECATION! Server defaulted to listening on external facing port ${resolvedPort} because "host" option is undefined. This feature will change soon. Please manually specify "host": "global" in RTL-Config.json if you want to continue exposing RTL to your entire LAN or gateway in future versions. The default value will change to '127.0.0.1' in the future so that RTL is only accessible on the RTL host machine by default`
    });
  }
};

let serverArgs = [];
if (common.ssl) {
  let sslConfig = new SSL(common.ssl);
  serverArgs.push(sslConfig.toObject());
}
serverArgs.push(appInstance);
let server = tcpModule.createServer(...serverArgs);

server.on('error', onError);
server.on('listening', onListening);

wsServer.mount(server);

server.listen(resolvedPort, resolvedHost === 'global' ? undefined : resolvedHost);

const app = require("./app");
const common = require("./common");
const debug = require("debug")("node-angular");
const http = require("http");
var connect = require('./connect').setServerConfiguration(); //Do NOT Remove
// const grpc = require('grpc');
// const protoLoader = require('@grpc/proto-loader');
// const packageDefinition = protoLoader.loadSync('./controllers/lnd/loop/client.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
// const looprpc = grpc.loadPackageDefinition(packageDefinition).looprpc;
// const swapClient = new looprpc.SwapClient('localhost:11010', grpc.credentials.createInsecure());

const onError = error => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + common.port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    case "ECONNREFUSED":
      console.error("Server is down/locked");
    default:
      console.error("DEFUALT ERROR");
      console.error(error.code);
      throw error;
  }
};

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + common.port;
  debug("Listening on " + bind);
  console.log('Server is up and running, please open the UI at http://localhost:' + common.port); 
};

const server = http.createServer(app);
 
// const io = require('socket.io')(server);

// const loopMonitor = io.of('/loopMonitor').on('connection', (socket) => {
//   let i = 1;
//   let call = null;
//   socket.on('start', function() {
//     console.log('Application started subscription');
//     console.log(call);
//     var request = {};
//     call = swapClient.monitor(request);
//     call.on('data', function(response) {
//       console.log('Monitor sent message as: ' + JSON.stringify(response));
//       socket.emit('message', { message: response });
//     });
//     call.on('status', function(status) {
//       console.log('Monitor status: ' + JSON.stringify(status));
//       socket.emit('status', { message: status });
//     });
//     call.on('end', function() {
//       console.log('Monitor stopped streaming');
//       socket.emit('end');
//     });
//     interval = setInterval(() => {
//       socket.emit('message', { message: 'Message ' + i });
//       i++;
//     }, 15000);
//   });
//   socket.on('end', function() {
//     call = null;
//     clearInterval(interval);
//     console.log('Socket stopped subscription');
//   });
// });

server.on("error", onError);
server.on("listening", onListening);
server.listen(common.port);

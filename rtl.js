const app = require("./app");
const common = require("./common");
const debug = require("debug")("node-angular");
const http = require("http");
var connect = require('./connect').setServerConfiguration(); //Do NOT Remove

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

server.on("error", onError);
server.on("listening", onListening);
server.listen(common.port);

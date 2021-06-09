#!/usr/bin/env node

const app = require("./routes/app");
const common = require("./routes/common");
const http = require("http");
var connect = require("./routes/connect").setServerConfiguration(); //Do NOT Remove

const onError = error => {
  if (error.syscall !== "listen") {
    throw error;
  }
  switch (error.code) {
    case "EACCES":
      console.error("http://" + (common.host ? common.host : 'localhost') + ":" + common.port + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error("http://" + (common.host ? common.host : 'localhost') + ":" + common.port + " is already in use");
      process.exit(1);
    case "ECONNREFUSED":
      console.error("Server is down/locked");
      process.exit(1);
    case "EBADCSRFTOKEN":
      console.error("Form tempered");
      process.exit(1);
    default:
      console.error("DEFUALT ERROR");
      console.error(error.code);
      throw error;
  }
};

const onListening = () => {
  console.log('Server is up and running, please open the UI at http://' + (common.host ? common.host : 'localhost') + ':' + common.port); 
};

const server = http.createServer(app);

server.on("error", onError);
server.on("listening", onListening);
if (common.host) {
  server.listen(common.port, common.host);
} else {
  server.listen(common.port);
}

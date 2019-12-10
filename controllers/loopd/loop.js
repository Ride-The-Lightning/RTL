const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const packageDefinition = protoLoader.loadSync('./controllers/loopd/client.proto', {keepCase: true, longs: String, enums: String, defaults: true, oneofs: true});
const looprpc = grpc.loadPackageDefinition(packageDefinition).looprpc;
const swapClient = new looprpc.SwapClient('localhost:11010', grpc.credentials.createInsecure());

exports.loopIn = (req, res, next) => {
  swapClient.loopIn(req.body, function(error, response) {
    if (error) {
      res.status(500).json({message: 'Loop In Failed!', error: error});
    } else {
      res.status(200).json(response);
    }
  })
};

exports.loopOut = (req, res, next) => {
  swapClient.loopOut(req.body, function(error, response) {
    if (error) {
      res.status(500).json({message: 'Loop Out Failed!', error: error});
    } else {
      res.status(200).json(response);
    }
  })
};

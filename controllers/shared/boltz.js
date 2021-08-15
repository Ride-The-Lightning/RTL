var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getInfo = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Getting Boltz Information..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Boltz Get Info Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/info';
  request(options).then(function (body) {
    logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Boltz Information Received'});
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz Get Info', data: body});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Boltz Get Info Error', error: err});
    return res.status(500).json({
      message: "Boltz Get Info Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.getServiceInfo = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Getting Service Information..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Boltz Get Service Info Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/serviceinfo';
  request(options).then(function (body) {
    logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Service Information Received'});
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz Get Service Info', data: body});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Boltz Get Service Info Error', error: err});
    return res.status(500).json({
      message: "Boltz Get Service Info Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.listSwaps = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Getting List Swaps..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Boltz List Swaps Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/listswaps';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz List Swaps Info', data: body});
    if (body && body.swaps && body.swaps.length && body.swaps.length > 0) { body.swaps = body.swaps.reverse(); }
    if (body && body.reverseSwaps && body.reverseSwaps.length && body.reverseSwaps.length > 0) { body.reverseSwaps = body.reverseSwaps.reverse(); }
    logger.log({level: 'INFO', fileName: 'Boltz', msg: 'List Swaps Received'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Boltz List Swaps Error', error: err});
    return res.status(500).json({
      message: "Boltz List Swaps Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.getSwapInfo = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Getting Swap..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Boltz Swap Info Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/swap/' + req.params.swapId;
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz Swap Info', data: body});
    logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Swap Received'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Boltz Swap Info Error', error: err});
    return res.status(500).json({
      message: "Boltz Swap Info Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.createSwap = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Creating Swap..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Create Swap Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/createswap';
  options.body = { amount: req.body.amount };
  if (req.body.address !== '') { options.body.address = req.body.address; }
  logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Create Swap Body', data: options.body});
  request.post(options).then(createSwapRes => {
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Create Swap Response', data: createSwapRes});
    if (!createSwapRes || createSwapRes.error) {
      logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Create Swap Error', error: createSwapRes.error});
      res.status(500).json({
        message: 'Create Swap Failed!',
        error: (!createSwapRes) ? 'Error From Server!' : createSwapRes.error.message
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Swap Created'});
      res.status(201).json(createSwapRes);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Create Swap Error', error: err});
    return res.status(500).json({
      message: "Create Swap Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.createReverseSwap = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Creating Reverse Swap..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Create Reverse Swap Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/createreverseswap';
  options.body = { amount: req.body.amount };
  if (req.body.address !== '') { options.body.address = req.body.address; }
  logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Create Reverse Swap Body', data: options.body});
  request.post(options).then(createReverseSwapRes => {
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Create Reverse Swap Response', data: createReverseSwapRes});
    if (!createReverseSwapRes || createReverseSwapRes.error) {
      logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Create Reverse Swap Error', error: createReverseSwapRes.error});
      res.status(500).json({
        message: 'Create Reverse Swap Failed!',
        error: (!createReverseSwapRes) ? 'Error From Server!' : createReverseSwapRes.error.message
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Reverse Swap Created'});
      res.status(201).json(createReverseSwapRes);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Create Reverse Swap Error', error: err});
    return res.status(500).json({
      message: "Create Reverse Swap Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.createChannel = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Creating Boltz Channel..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Create Channel Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/createchannel';
  options.body = { amount: req.body.amount };
  if (req.body.address !== '') { options.body.address = req.body.address; }
  logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Create Channel Body', data: options.body});
  request.post(options).then(createChannelRes => {
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Create Channel Response', data: createChannelRes});
    if (!createChannelRes || createChannelRes.error) {
      logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Create Channel Error', error: createChannelRes.error});
      res.status(500).json({
        message: 'Create Channel Failed!',
        error: (!createChannelRes) ? 'Error From Server!' : createChannelRes.error.message
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Boltz Channel Created'});
      res.status(201).json(createChannelRes);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Create Channel Error', error: err});
    return res.status(500).json({
      message: "Create Channel Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.deposit = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Boltz Deposit Start..'});
  options = common.getBoltzServerOptions();
  if (options.url === '') { return res.status(500).json({message: "Deposit Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/deposit';
  request.post(options).then(depositRes => {
    logger.log({level: 'DEBUG', fileName: 'Boltz', msg: 'Deposit Response', data: depositRes});
    if (!depositRes || depositRes.error) {
      logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Deposit Error', error: depositRes.error});
      res.status(500).json({
        message: 'Deposit Failed!',
        error: (!depositRes) ? 'Error From Server!' : depositRes.error.message
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Boltz', msg: 'Boltz Deposit Finished'});
      res.status(201).json(depositRes);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Boltz', msg: 'Deposit Error', error: err});
    return res.status(500).json({
      message: "Deposit Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

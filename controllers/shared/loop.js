var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('./logger');
var options = {};

exports.loopOut = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Looping Out..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop Out Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/out';
  options.body = {
    amt: req.body.amount,
    sweep_conf_target: req.body.targetConf,
    max_swap_routing_fee: req.body.swapRoutingFee,
    max_miner_fee: req.body.minerFee,
    max_prepay_routing_fee: req.body.prepayRoutingFee,
    max_prepay_amt: req.body.prepayAmt,
    max_swap_fee: req.body.swapFee,
    swap_publication_deadline: req.body.swapPublicationDeadline,
    initiator: 'RTL'
  };
  if (req.body.chanId !== '') { options.body['loop_out_channel'] = req.body.chanId; }
  if (req.body.destAddress !== '') { options.body['dest'] = req.body.destAddress; }
  logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Body', data: options.body});
  request.post(options).then(loopOutRes => {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out', data: loopOutRes});
    if(!loopOutRes || loopOutRes.error) {
      logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop Out Error', error: loopOutRes.error});
      res.status(500).json({
        message: 'Loop Out Failed!',
        error: (!loopOutRes) ? 'Error From Server!' : loopOutRes.error.message
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop Out Finished'});
      res.status(201).json(loopOutRes);
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
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop Out Error', error: err});
    return res.status(500).json({
      message: "Loop Out Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.loopOutTerms = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Terms..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop Out Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/out/terms';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Terms', data: body});
    logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop Out Terms Received'});
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
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop Out Terms Error', error: err});
    return res.status(500).json({
      message: "Loop Out Terms Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.loopOutQuote = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Quotes..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop Out Quote Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/out/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
  logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quote URL', data: options.url});
  request(options).then(function (quoteRes) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quote', data: quoteRes});
    quoteRes.amount = +req.params.amount;
    quoteRes.swap_payment_dest = quoteRes.swap_payment_dest ? Buffer.from(quoteRes.swap_payment_dest, 'base64').toString('hex') : '';
    logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop Out Quotes Received'});
    res.status(200).json(quoteRes);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop Out Quote Error', error: err});
    return res.status(500).json({
      message: "Loop Out Quote Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.loopOutTermsAndQuotes = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Terms & Quotes..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop Out Terms And Quotes Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/out/terms';
  request(options).then(function(terms) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Terms', data: terms});
    const options1 = common.getSwapServerOptions(); const options2 = common.getSwapServerOptions();
    options1.url = options1.url + '/v1/loop/out/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    options2.url = options2.url + '/v1/loop/out/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Min Quote Options', data: options1});
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Max Quote Options', data: options2});
    return Promise.all([request(options1), request(options2)]).then(function(values) {
      values[0].amount = +terms.min_swap_amount;
      values[1].amount = +terms.max_swap_amount;
      values[0].swap_payment_dest = values[0].swap_payment_dest ? Buffer.from(values[0].swap_payment_dest, 'base64').toString('hex') : '';
      values[1].swap_payment_dest = values[1].swap_payment_dest ? Buffer.from(values[1].swap_payment_dest, 'base64').toString('hex') : '';
      logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quotes 1', data: values[0]});
      logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quotes 2', data: values[1]});
      logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop Out Terms & Quotes Received'});
      res.status(200).json(values);
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop Out Quotes Error', error: err});
      return res.status(500).json({
        message: "Loop Out Quotes Failed!",
        error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
      });
    });
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop Out Terms Error', error: err});
    return res.status(500).json({
      message: "Loop Out Terms Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.loopIn = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Looping In..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop In Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/in';
  options.body = {
    amt: req.body.amount,
    max_swap_fee: req.body.swapFee,
    max_miner_fee: req.body.minerFee,
    initiator: 'RTL'
  };
  logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Body', data: options.body});
  request.post(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop In Error', error: body.error});
      res.status(500).json({
        message: 'Loop In Failed!',
        error: (body.error && body.error.message) ? body.error.message : 'Error From Server!'
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop In Finished'});
      res.status(201).json(body);
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
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop In Error', error: err});
    return res.status(500).json({
      message: "Loop In Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.loopInTerms = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Terms..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/in/terms';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Terms', data: body});
    logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop In Terms Received'});
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
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop In Terms Error', error: err});
    return res.status(500).json({
      message: "Loop In Terms Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.loopInQuote = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Quotes..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop In Quote Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/in/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
  logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quote Options', data: options.url});
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quote', data: body});
    body.amount = +req.params.amount;
    body.swap_payment_dest = body.swap_payment_dest ? Buffer.from(body.swap_payment_dest, 'base64').toString('hex') : '';
    logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop In Qoutes Received'});
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
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop In Quote Error', error: err});
    return res.status(500).json({
      message: "Loop In Quote Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.loopInTermsAndQuotes = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Terms & Quotes..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop In Terms And Quotes Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/in/terms';
  request(options).then(function(terms) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Terms', data: terms});
    const options1 = common.getSwapServerOptions(); const options2 = common.getSwapServerOptions();
    options1.url = options1.url + '/v1/loop/in/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    options2.url = options2.url + '/v1/loop/in/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Min Quote Options', data: options1});
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Max Quote Options', data: options2});
    return Promise.all([request(options1), request(options2)]).then(function(values) {
      values[0].amount = +terms.min_swap_amount;
      values[1].amount = +terms.max_swap_amount;
      values[0].swap_payment_dest = values[0].swap_payment_dest ? Buffer.from(values[0].swap_payment_dest, 'base64').toString('hex') : '';
      values[1].swap_payment_dest = values[1].swap_payment_dest ? Buffer.from(values[1].swap_payment_dest, 'base64').toString('hex') : '';
      logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quotes 1', data: values[0]});
      logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quotes 2', data: values[1]});
      logger.log({level: 'INFO', fileName: 'Loop', msg: 'Loop In Terms & Qoutes Received'});
      res.status(200).json(values);
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop In Quotes Error', error: err});
      return res.status(500).json({
        message: "Loop In Quotes Failed!",
        error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
      });
    });
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Loop In Terms Error', error: err});
    return res.status(500).json({
      message: "Loop In Terms Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.swaps = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting List Swaps..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop Out Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/swaps';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Swaps', data: body});
    if (body.swaps && body.swaps.length > 0) {
      body.swaps = common.sortDescByKey(body.swaps, 'initiation_time');
      logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Swaps after Sort', data: body});
    }
    logger.log({level: 'INFO', fileName: 'Loop', msg: 'List Swaps Received'});
    res.status(200).json(body.swaps);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'List Swaps Error', error: err});
    return res.status(500).json({
      message: "Loop Swaps Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

exports.swap = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Loop', msg: 'Getting Swap Information..'});
  options = common.getSwapServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Loop Out Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/loop/swap/' + req.params.id;
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Loop', msg: 'Loop Swap', data: body});
    logger.log({level: 'INFO', fileName: 'Loop', msg: 'Swap Information Received'});
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
    logger.log({level: 'ERROR', fileName: 'Loop', msg: 'Swap Info Error', error: err});
    return res.status(500).json({
      message: "Loop Swap Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

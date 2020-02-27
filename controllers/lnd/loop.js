var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};
var swapServerUrl = '';

exports.loopOut = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop Out Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/out';
  let body = {};
  if (req.body.chanId !== '') {
    body = {
      amt: req.body.amount,
      loop_out_channel: req.body.chanId,
      sweep_conf_target: req.body.targetConf,
      max_swap_routing_fee: req.body.swapRoutingFee,
      max_miner_fee: req.body.minerFee,
      max_prepay_routing_fee: req.body.prepayRoutingFee,
      max_prepay_amt: req.body.prepayAmt,
      max_swap_fee: req.body.swapFee
    };
  } else {
    body = {
      amt: req.body.amount,
      sweep_conf_target: req.body.targetConf,
      max_swap_routing_fee: req.body.swapRoutingFee,
      max_miner_fee: req.body.minerFee,
      max_prepay_routing_fee: req.body.prepayRoutingFee,
      max_prepay_amt: req.body.prepayAmt,
      max_swap_fee: req.body.swapFee
    };
  }
  options.body = JSON.stringify(body);
  logger.info({fileName: 'Loop', msg: 'Loop Out Body: ' + options.body});
  request.post(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Out: ' + JSON.stringify(body)});
    if(!body || body.error) {
      res.status(500).json({
        message: 'Loop Out Failed!',
        error: (!body) ? 'Error From Server!' : body.error.message
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Loop Out', lineNum: 33, msg: 'Loop Out Failed: ' + JSON.stringify(err.error)});
    return res.status(500).json({
      message: "Loop Out Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.loopOutTerms = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop Out Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/out/terms';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Terms: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Terms Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.loopOutQuote = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop Out Quote Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/out/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
  logger.info({fileName: 'Loop', msg: 'Loop Out Quote URL: ' + options.url});
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Quote: ' + body});
    body = JSON.parse(body);
    body.amount = +req.params.amount;
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Quote Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.loopOutTermsAndQuotes = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop Out Terms And Quotes Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/out/terms';
  request(options).then(function(terms) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Terms: ' + JSON.stringify(terms)});
    const options1 = {}; const options2 = {};
    terms = JSON.parse(terms);
    options1.url = swapServerUrl + '/loop/out/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
    options2.url = swapServerUrl + '/loop/out/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
    Promise.all([request(options1), request(options2)]).then(function(values) {
      values[0] = JSON.parse(values[0]);
      values[1] = JSON.parse(values[1]);
      values[0].amount = +terms.min_swap_amount;
      values[1].amount = +terms.max_swap_amount;
      logger.info({fileName: 'Loop', msg: 'Loop Out Quotes 1: ' + JSON.stringify(values[0])});
      logger.info({fileName: 'Loop', msg: 'Loop Out Quotes 2: ' + JSON.stringify(values[1])});
      res.status(200).json(values);
    })
    .catch((err) => {
      return res.status(500).json({
        message: "Loop Out Quotes Failed!",
        error: err.error.error ? err.error.error : err.error
      });
    });
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Terms Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.loopIn = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop In Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/in';
  options.body = JSON.stringify({
    amt: req.body.amount,
    max_swap_fee: req.body.swapFee,
    max_miner_fee: req.body.minerFee,
    last_hop: req.body.lastHop,
    external_htlc: req.body.externalHtlc
  });
  request.post(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop In: ' + JSON.stringify(body)});
    if(!body || body.error) {
      res.status(500).json({
        message: 'Loop In Failed!',
        error: (!body) ? 'Error From Server!' : body.error.message
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Loop In', lineNum: 134, msg: 'Loop In Failed: ' + JSON.stringify(err.error)});
    return res.status(500).json({
      message: "Loop In Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.loopInTerms = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/in/terms';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop In Terms: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Terms Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.loopInQuote = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop In Quote Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/in/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
  logger.info({fileName: 'Loop', msg: 'Loop In Quote Options: ' + options.url});
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop In Quote: ' + JSON.stringify(body)});
    body = JSON.parse(body);
    body.amount = +req.params.amount;
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Quote Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.loopInTermsAndQuotes = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop In Terms And Quotes Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/in/terms';
  request(options).then(function(terms) {
    logger.info({fileName: 'Loop', msg: 'Loop In Terms: ' + JSON.stringify(terms)});
    const options1 = {}; const options2 = {};
    terms = JSON.parse(terms);

    //Delete after https://github.com/lightninglabs/loop/issues/157 fixed
    terms.max_swap_amount = '280000';
    //Delete after https://github.com/lightninglabs/loop/issues/157 fixed

    options1.url = swapServerUrl + '/loop/in/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
    options2.url = swapServerUrl + '/loop/in/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
    Promise.all([request(options1), request(options2)]).then(function(values) {
      values[0] = JSON.parse(values[0]);
      values[1] = JSON.parse(values[1]);
      values[0].amount = +terms.min_swap_amount;
      values[1].amount = +terms.max_swap_amount;
      logger.info({fileName: 'Loop', msg: 'Loop In Quotes 1: ' + JSON.stringify(values[0])});
      logger.info({fileName: 'Loop', msg: 'Loop In Quotes 2: ' + JSON.stringify(values[1])});
      res.status(200).json(values);
    })
    .catch((err) => {
      return res.status(500).json({
        message: "Loop In Quotes Failed!",
        error: err.error.error ? err.error.error : err.error
      });
    });
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Terms Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.swaps = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop Out Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/swaps';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Swaps: ' + body});
    body = JSON.parse(body);
    if (body.swaps && body.swaps.length > 0) {
      body.swaps.forEach(swap => {
        swap.initiation_time_str =  (!swap.initiation_time) ? '' : common.convertTimestampToDate(Math.round(swap.initiation_time/1000000000));
        swap.last_update_time_str =  (!swap.last_update_time) ? '' : common.convertTimestampToDate(Math.round(swap.last_update_time/1000000000));
      });
      body.swaps = common.sortDescByKey(body.swaps, 'initiation_time');
      logger.info({fileName: 'Loop', msg: 'Loop Swaps after Sort: ' + JSON.stringify(body)});
    }
    res.status(200).json(body.swaps);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Swaps Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};

exports.swap = (req, res, next) => {
  swapServerUrl = common.getSelSwapServerUrl();  
  if(swapServerUrl === '') { return res.status(500).json({message: "Loop Out Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = swapServerUrl + '/loop/swap/' + req.params.id;
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Swap: ' + body});
    body = JSON.parse(body);
    body.initiation_time_str =  (!body.initiation_time) ? '' : common.convertTimestampToDate(Math.round(body.initiation_time/1000000000));
    body.last_update_time_str =  (!body.last_update_time) ? '' : common.convertTimestampToDate(Math.round(body.last_update_time/1000000000));
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Swap Failed!",
      error: err.error.error ? err.error.error : err.error
    });
  });
};


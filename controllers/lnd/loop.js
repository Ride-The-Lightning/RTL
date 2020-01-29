var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};
var loopServerUrl = '';

exports.loopOut = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop Out Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = loopServerUrl + '/loop/out';
  options.body = JSON.stringify({
    amt: req.body.amount,
    loop_out_channel: req.body.chanId,
    sweep_conf_target: 2,
    max_swap_routing_fee: 5010,
    max_miner_fee: 447,
    max_prepay_routing_fee: 36,
    max_prepay_amt: 1337,
    max_swap_fee: 350
  });
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
      error: err.error
    });
  });
};

exports.loopOutTerms = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop Out Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = loopServerUrl + '/loop/out/terms';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Terms: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Terms Failed!",
      error: err.error
    });
  });
};

exports.loopOutQuote = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop Out Quote Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = loopServerUrl + '/loop/out/quote/' + req.params.amount + '?conf_target=' + req.query.targetConf ? req.query.targetConf : '2';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Quote: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Quote Failed!",
      error: err.error
    });
  });
};

exports.loopOutTermsAndQuotes = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop Out Terms And Quotes Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = loopServerUrl + '/loop/out/terms';
  request(options).then(function(terms) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Terms: ' + JSON.stringify(terms)});
    const options1 = {}; const options2 = {};
    terms = JSON.parse(terms);
    options1.url = loopServerUrl + '/loop/out/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
    options2.url = loopServerUrl + '/loop/out/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
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
        error: err
      });
    });
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Terms Failed!",
      error: err
    });
  });
};

exports.loopIn = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  // max_prepay_routing_fee: 36,
  // max_prepay_amt: 1337,
  // sweep_conf_target: 2,
  // max_swap_routing_fee: 5010,
  options.url = loopServerUrl + '/loop/in';
  options.body = JSON.stringify({
    amt: req.body.amount,
    loop_in_channel: req.body.chanId,
    max_miner_fee: 447,
    max_swap_fee: 350,
    external_htlc: false
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
      error: err.error
    });
  });
};

exports.loopInTerms = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = loopServerUrl + '/loop/in/terms';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop In Terms: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Terms Failed!",
      error: err.error
    });
  });
};

exports.loopInQuote = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Quote Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = loopServerUrl + '/loop/in/quote';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop In Quote: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Quote Failed!",
      error: err.error
    });
  });
};

exports.loopInTermsAndQuotes = (req, res, next) => {
  loopServerUrl = common.getSelLoopServerUrl();  
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms And Quotes Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options.url = loopServerUrl + '/loop/in/terms';
  request(options).then(function(terms) {
    logger.info({fileName: 'Loop', msg: 'Loop In Terms: ' + JSON.stringify(terms)});
    const options1 = {}; const options2 = {};
    terms = JSON.parse(terms);
    options1.url = loopServerUrl + '/loop/in/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
    options2.url = loopServerUrl + '/loop/in/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2');
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
        error: err
      });
    });
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Terms Failed!",
      error: err
    });
  });
};

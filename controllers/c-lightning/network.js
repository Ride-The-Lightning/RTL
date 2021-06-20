var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getRoute = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Network', msg: 'Getting Network Routes..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/getRoute/' + req.params.destPubkey + '/' + req.params.amount;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Network', msg: 'Query Routes Received', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Network', msg: 'Query Routes Error', error: body.error});
      res.status(500).json({
        message: "Fetching Query Routes Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    logger.log({level: 'INFO', fileName: 'Network', msg: 'Network Routes Received'});
    res.status(200).json({routes: body});
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Network', msg: 'Query Routes Error', error: err});
    return res.status(500).json({
      message: "Fetching Query Routes Failed!",
      error: err.error
    });
  });
};

exports.listNode = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Network', msg: 'Node Lookup..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/listNode/' + req.params.id;
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Network', msg: 'Node Lookup', data: body});
    logger.log({level: 'INFO', fileName: 'Network', msg: 'Node Lookup Finished'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Network', msg: 'Node Lookup Error', error: err});
    return res.status(500).json({
      message: "Node Lookup Failed!",
      error: err.error
    });
  });
};

exports.listChannel = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Network', msg: 'Channel Lookup..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/listChannel/' + req.params.channelShortId;
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Network', msg: 'Channel Lookup', data: body});
    logger.log({level: 'INFO', fileName: 'Network', msg: 'Channel Lookup Finished'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Network', msg: 'Channel Lookup Error', error: err});
    return res.status(500).json({
      message: "Channel Lookup Failed!",
      error: err.error
    });
  });
};

exports.feeRates = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Network', msg: 'Getting Network Fee Rates..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/feeRates/' + req.params.feeRateStyle;
  request(options).then(function (body) {
    logger.log({level: 'INFO', fileName: 'Network', msg: 'Network Fee Rates Received'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Network', msg: 'Fee Rates Error', error: err});
    return res.status(500).json({
      message: "Fee Rates Failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../utils/common');
var logger = require('../../utils/logger');
var options = {};

exports.getRoute = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Network', msg: 'Getting Network Routes..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/getRoute/' + req.params.destPubkey + '/' + req.params.amount;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Network', msg: 'Query Routes Received', data: body});
    logger.log({level: 'INFO', fileName: 'Network', msg: 'Network Routes Received'});
    res.status(200).json({routes: body});
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Network', 'Query Routes Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
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
    const err = common.handleError(errRes,  'Network', 'Node Lookup Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
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
    const err = common.handleError(errRes,  'Network', 'Channel Lookup Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

exports.feeRates = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Network', msg: 'Getting Network Fee Rates..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/feeRates/' + req.params.feeRateStyle;
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Network', msg: 'Network Fee Rates Received for ' + req.params.feeRateStyle, data: body});
    res.status(200).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Network', 'Fee Rates Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

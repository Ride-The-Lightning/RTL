var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getRoute = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/getRoute/' + req.params.destPubkey + '/' + req.params.amount;
  request(options).then((body) => {
    logger.info({fileName: 'Network', msg: 'Query Routes Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Network', lineNum: 12, msg: 'Query Routes Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Query Routes Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
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
    logger.error({fileName: 'Network', lineNum: 27, msg: 'Query Routes Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Query Routes Failed!",
      error: err.error
    });
  });
};

exports.listNode = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/listNode/' + req.params.id;
  request(options).then(function (body) {
    logger.info({fileName: 'Network', msg: 'Node Lookup: ' + JSON.stringify(body)});
    body.forEach(node => {
      node.last_timestamp_str =  (node.last_timestamp) ? common.convertTimestampToDate(node.last_timestamp) : '';
    });
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
    logger.error({fileName: 'Network', lineNum: 52, msg: 'Node Lookup Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Node Lookup Failed!",
      error: err.error
    });
  });
};

exports.listChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/listChannel/' + req.params.channelShortId;
  request(options).then(function (body) {
    logger.info({fileName: 'Network', msg: 'Channel Lookup: ' + JSON.stringify(body)});
    body[0].last_update_str =  (body.length > 0 && body[0].last_update) ? common.convertTimestampToDate(body[0].last_update) : '';
    body[1].last_update_str =  (body.length > 1 && body[1].last_update) ? common.convertTimestampToDate(body[1].last_update) : '';
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
    logger.error({fileName: 'Network', lineNum: 76, msg: 'Channel Lookup Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Channel Lookup Failed!",
      error: err.error
    });
  });
};

exports.feeRates = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/network/feeRates/' + req.params.feeRateStyle;
  request(options).then(function (body) {
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
    logger.error({fileName: 'Network', lineNum: 97, msg: 'Fee Rates Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fee Rates Failed!",
      error: err.error
    });
  });
};

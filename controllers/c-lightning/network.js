var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getRoute = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/network/getRoute/' + req.params.destPubkey + '/' + req.params.amount;
  request(options).then((body) => {
    logger.info({fileName: 'Network', msg: 'Query Routes Received: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching Query Routes Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    }
    res.status(200).json({routes: body});
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fetching Query Routes Failed!",
      error: err.error
    });
  });
};

exports.listNode = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/network/listNode/' + req.params.id;
  request(options).then(function (body) {
    logger.info({fileName: 'Network', msg: 'Node Lookup: ' + JSON.stringify(body)});
    body.last_timestamp_str =  (body.last_timestamp) ? common.convertTimestampToDate(body.last_timestamp) : '';
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Node Lookup Failed!",
      error: err.error
    });
  });
};

exports.listChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/network/listChannel/' + req.params.channelShortId;
  request(options).then(function (body) {
    logger.info({fileName: 'Network', msg: 'Channel Lookup: ' + JSON.stringify(body)});
    body[0].last_update_str =  (body.length > 0 && body[0].last_update) ? common.convertTimestampToDate(body[0].last_update) : '';
    body[1].last_update_str =  (body.length > 1 && body[1].last_update) ? common.convertTimestampToDate(body[1].last_update) : '';
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Channel Lookup Failed!",
      error: err.error
    });
  });
};

exports.feeRates = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/network/feeRates/' + req.params.feeRateStyle;
  request(options).then(function (body) {
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fee Rates Failed!",
      error: err.error
    });
  });
};

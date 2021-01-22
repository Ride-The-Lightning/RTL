var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/balance/' + req.params.source;
  options.qs = req.query;
  request(options).then((body) => {
    logger.info({fileName: 'Balance', msg: 'Request params: ' + JSON.stringify(req.params) + 'Request Query: ' + JSON.stringify(req.query) + ' Balance Received: ' + JSON.stringify(body)});
    if (body) {
      if (req.params.source === 'blockchain') {
        if (!body.total_balance) { body.total_balance = 0; }
        if (!body.confirmed_balance) { body.confirmed_balance = 0; }
        if (!body.unconfirmed_balance) { body.unconfirmed_balance = 0; }
        body.btc_total_balance = common.convertToBTC(body.total_balance);
        body.btc_confirmed_balance = common.convertToBTC(body.confirmed_balance);
        body.btc_unconfirmed_balance = common.convertToBTC(body.unconfirmed_balance);
      }
      if (req.params.source === 'channels') {
        if (!body.balance) { body.balance = 0; }
        if (!body.pending_open_balance) { body.pending_open_balance = 0; }
        body.btc_balance = common.convertToBTC(body.balance);
        body.btc_pending_open_balance = common.convertToBTC(body.pending_open_balance);
      }
      res.status(200).json(body);
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
    logger.error({fileName: 'Balance', lineNum: 38, msg: 'Fetch Balance Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching balance failed!",
      error: err.error
    });
  });
};

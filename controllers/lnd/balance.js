var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getBalance = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Balance', msg: 'Getting Balance..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/balance/' + req.params.source;
  options.qs = req.query;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Balance', msg: '[Request params, Request Query, Balance Received]', data: [req.params, req.query, body]});
    if (body) {
      if (req.params.source === 'blockchain') {
        if (!body.total_balance) { body.total_balance = 0; }
        if (!body.confirmed_balance) { body.confirmed_balance = 0; }
        if (!body.unconfirmed_balance) { body.unconfirmed_balance = 0; }
      }
      if (req.params.source === 'channels') {
        if (!body.balance) { body.balance = 0; }
        if (!body.pending_open_balance) { body.pending_open_balance = 0; }
      }
      logger.log({level: 'INFO', fileName: 'Balance', msg: 'Balance Received'});
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
    logger.log({level: 'ERROR', fileName: 'Balance', msg: 'Fetch Balance Error', error: err});
    return res.status(500).json({
      message: "Fetching balance failed!",
      error: err.error
    });
  });
};

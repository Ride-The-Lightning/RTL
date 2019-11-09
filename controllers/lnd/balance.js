var request = require('request-promise');
var upperCase = require('upper-case');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/balance/' + req.params.source;
  options.qs = req.query;
  request(options).then((body) => {
    logger.info({fileName: 'Balance', msg: 'Request params: ' + JSON.stringify(req.params) + 'Request Query: ' + JSON.stringify(req.query) + ' Balance Received: ' + JSON.stringify(body)});
    if(undefined !== body) {
      if (upperCase(req.params.source) === 'BLOCKCHAIN') {
        if (!body.total_balance) { body.total_balance = 0; }
        if (!body.confirmed_balance) { body.confirmed_balance = 0; }
        if (!body.unconfirmed_balance) { body.unconfirmed_balance = 0; }
        body.btc_total_balance = common.convertToBTC(body.total_balance);
        body.btc_confirmed_balance = common.convertToBTC(body.confirmed_balance);
        body.btc_unconfirmed_balance = common.convertToBTC(body.unconfirmed_balance);
      }
      if (upperCase(req.params.source) === 'CHANNELS') {
        if (!body.balance) { body.balance = 0; }
        if (!body.pending_open_balance) { body.pending_open_balance = 0; }
        body.btc_balance = common.convertToBTC(body.balance);
        body.btc_pending_open_balance = common.convertToBTC(body.pending_open_balance);
      }
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching balance failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var options = require("../connect");
var common = require('../common');
var logger = require('./logger');

exports.getBalance = (req, res, next) => {
  options.url = common.lnd_server_url + '/balance/' + req.params.source;
  options.qs = req.query;
  request(options).then((body) => {
    logger.info('\r\nBalance: 9: ' + JSON.stringify(Date.now()) + ': INFO: ' + 'Request params: ' + JSON.stringify(req.params) + 'Request Query: ' + JSON.stringify(req.query) + ' Balance Received: ' + JSON.stringify(body));
    if(undefined !== body) {
      body.btc_balance = (undefined === body.balance) ? 0 : common.convertToBTC(body.balance);
      body.btc_total_balance = (undefined === body.total_balance) ? 0 : common.convertToBTC(body.total_balance);
      body.btc_confirmed_balance = (undefined === body.confirmed_balance) ? 0 : common.convertToBTC(body.confirmed_balance);
      body.btc_unconfirmed_balance = (undefined === body.unconfirmed_balance) ? 0 : common.convertToBTC(body.unconfirmed_balance);
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

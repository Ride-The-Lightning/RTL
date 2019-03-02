var request = require('request-promise');
var common = require('../common');
var logger = require('./logger');
var options = {};

exports.decodePayment = (req, res, next) => {
  options = common.options;
  options.url = common.lnd_server_url + '/payreq/' + req.params.payRequest;
  request(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    logger.info('\r\nPayReq: 10: ' + JSON.stringify(Date.now()) + ': INFO: Payment Decodd Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Payment Request Decode Failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.btc_num_satoshis = (undefined === body.num_satoshis) ? 0 : common.convertToBTC(body.num_satoshis);
      body.timestamp_str =  (undefined === body.timestamp) ? '' : common.convertTimestampToDate(body.timestamp);
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Payment Request Decode Failed!",
      error: err.error
    });
  });
};

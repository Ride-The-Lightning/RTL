var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.decodePayment = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/payreq/' + req.params.payRequest;
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'PayReq', msg: 'Payment Decode Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Payment Request Decode Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.btc_num_satoshis = (!body.num_satoshis) ? 0 : common.convertToBTC(body.num_satoshis);
      body.timestamp_str =  (!body.timestamp) ? '' : common.convertTimestampToDate(body.timestamp);
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

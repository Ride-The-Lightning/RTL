var request = require('request-promise');
var options = require("../connect");
var common = require('../common');

exports.decodePayment = (req, res, next) => {
  options.url = common.lnd_server_url + '/payreq/' + req.params.payRequest;
  console.log('Options URL: ' + JSON.stringify(options.url));
  request(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    console.log("Payment Request Decoded Received: " + body_str);
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

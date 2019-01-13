var request = require('request-promise');
var options = require("../connect");
var common = require('../common');
var logger = require('./logger');

exports.getFees = (req, res, next) => {
  options.url = common.lnd_server_url + '/fees';
  request(options).then((body) => {
    logger.info('\r\nFees: 8: ' + JSON.stringify(Date.now()) + ': INFO: Fee Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching fee failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined === body.day_fee_sum) {
        body.day_fee_sum = 0;
        body.btc_day_fee_sum = 0;
      } else {
        body.btc_day_fee_sum = common.convertToBTC(body.day_fee_sum);
      }
      if (undefined === body.week_fee_sum) {
        body.week_fee_sum = 0;
        body.btc_week_fee_sum = 0;
      } else {
        body.btc_week_fee_sum = common.convertToBTC(body.week_fee_sum);
      }
      if (undefined === body.month_fee_sum) {
        body.month_fee_sum = 0;
        body.btc_month_fee_sum = 0;
      } else {
        body.btc_month_fee_sum = common.convertToBTC(body.month_fee_sum);
      }
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching fee failed!",
      error: err.error
    });
  });
};

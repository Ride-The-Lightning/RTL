var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.getFees = (req, res, next) => {
  options.url = config.lnd_server_url + '/fees';
  request.get(options, (error, response, body) => {
    console.log("Fee Received: " + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching fee failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      if (undefined === body.day_fee_sum) {
        body.day_fee_sum = 0;
      }
      if (undefined === body.week_fee_sum) {
        body.week_fee_sum = 0;
      }
      if (undefined === body.month_fee_sum) {
        body.month_fee_sum = 0;
      }
      res.status(200).json({fees: body});
    }
  });
};

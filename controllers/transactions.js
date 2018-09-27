var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.postTransactions = (req, res, next) => {
  options.url = config.lnd_server_url + '/transactions';
  options.form = JSON.stringify({ 
    amount: req.body.amount,
    addr: req.body.address,
    sat_per_byte: req.body.fees,
    target_conf: req.body.blocks
  });
  request.post(options, (error, response, body) => {
    console.log('Transactions Post Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Transactions post failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  });
};

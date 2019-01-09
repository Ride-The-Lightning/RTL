var request = require('request-promise');
var options = require("../connect");
var common = require('../common');

exports.getTransactions = (req, res, next) => {
  options.url = common.lnd_server_url + '/transactions';
  request(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    console.log('Transactions Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching Transactions Failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined !== body.transactions) {
        body.transactions.forEach(transaction => {
          transaction.time_stamp_str =  (undefined === transaction.time_stamp) ? '' : common.convertTimestampToDate(transaction.time_stamp);
        });
      }
      res.status(200).json(body.transactions);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching Transactions Failed!",
      error: err.error
    });
  });
};

exports.postTransactions = (req, res, next) => {
  options.url = common.lnd_server_url + '/transactions';
  options.form = JSON.stringify({ 
    amount: req.body.amount,
    addr: req.body.address,
    sat_per_byte: req.body.fees,
    target_conf: req.body.blocks
  });
  request.post(options).then((body) => {
    console.log('Transactions Post Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Transactions post failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Transactions post failed!",
      error: err.error
    });
  });
};

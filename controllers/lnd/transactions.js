var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getTransactions = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/transactions';
  request(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'Transactions', msg: 'Transaction Received: ' + body_str});
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching Transactions Failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined !== body.transactions && body.transactions.length > 0) {
        body.transactions.forEach(transaction => {
          transaction.time_stamp_str =  (undefined === transaction.time_stamp) ? '' : common.convertTimestampToDate(transaction.time_stamp);
        });
        body.transactions = common.sortDescByKey(body.transactions, 'time_stamp');
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
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/transactions';
  options.form = { 
    amount: req.body.amount,
    addr: req.body.address,
    sat_per_byte: req.body.fees,
    target_conf: req.body.blocks
  };
  if (req.body.sendAll) {
    options.form.send_all = req.body.sendAll;
  }
  options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.info({fileName: 'Transactions', msg: 'Transaction Post Response: ' + JSON.stringify(body)});
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

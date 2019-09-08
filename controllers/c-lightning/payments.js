var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.listPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/pay/listPayments';
  request(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Payment List Received: ' + JSON.stringify(body.payments)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Payments List Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined !== body && undefined !== body.payments) {
        body.payments.forEach(payment => {
          payment.created_at_str =  (undefined === payment.created_at) ? '' : common.convertTimestampToDate(payment.created_at);
        });
        body.payments = common.sortDescByKey(body.payments, 'created_at');
      }
      res.status(200).json(body.payments);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Payments List Failed!",
      error: err.error
    });
  });
};

exports.decodePayment = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/pay/decodePay/' + req.params.invoice;
  request(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Payment Decode Received: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Payment Request Decode Failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      // body.btc_num_satoshis = (undefined === body.num_satoshis) ? 0 : common.convertToBTC(body.num_satoshis);
      // body.timestamp_str =  (undefined === body.timestamp) ? '' : common.convertTimestampToDate(body.timestamp);
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

exports.postPayment = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/pay';
  options.body = req.body;
  // options.body = { 
  //   amount: req.body.amount,
  //   addr: req.body.address,
  //   sat_per_byte: req.body.fees,
  //   target_conf: req.body.blocks
  // };
  // if (req.body.sendAll) {
  //   options.form.send_all = req.body.sendAll;
  // }
  // options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Payment Post Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Payment post failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Payment post failed!",
      error: err.error
    });
  });
};

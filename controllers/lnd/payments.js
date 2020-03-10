var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/payments';
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'Payments', msg: 'Payment Decoded Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Payments List Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if ( body.payments && body.payments.length > 0) {
        body.payments.forEach(payment => {
          payment.creation_date_str =  (!payment.creation_date) ? '' : common.convertTimestampToDate(payment.creation_date);
        });
        body.payments = common.sortDescByKey(body.payments, 'creation_date');
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

var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/payments';
  request(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'Payments', msg: 'Payment Decoded Received: ' + body_str});
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Payments List Failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined !== body.payments) {
        body.payments.forEach(payment => {
          payment.creation_date_str =  (undefined === payment.creation_date) ? '' : common.convertTimestampToDate(payment.creation_date);
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

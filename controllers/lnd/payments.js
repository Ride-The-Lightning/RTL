var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/payments';
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'Payments', msg: 'Payment List Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.error({fileName: 'Payments', lineNum: 14, msg: 'List Payments Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Payments List Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if ( body.payments && body.payments.length > 0) {
        body.payments.forEach(payment => {
          payment.creation_date_str =  (!payment.creation_date) ? '' : common.convertTimestampToDate(payment.creation_date);
          payment.htlcs.forEach(htlc => {
            htlc.attempt_time_str =  (!htlc.attempt_time_ns) ? '' : common.convertTimestampToDate(Math.round(htlc.attempt_time_ns/1000000000));
            htlc.resolve_time_str =  (!htlc.resolve_time_ns) ? '' : common.convertTimestampToDate(Math.round(htlc.resolve_time_ns/1000000000));
          });
        });
        body.payments = common.sortDescByKey(body.payments, 'creation_date');
      }
      logger.info({fileName: 'Payments', msg: 'Payment List After Dates: ' + JSON.stringify(body.payments)});
      res.status(200).json(body.payments);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Payments', lineNum: 36, msg: 'List Payments Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Payments List Failed!",
      error: err.error
    });
  });
};

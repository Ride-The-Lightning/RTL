var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

decodePaymentFromPaymentRequest = (payment) => {
  options.url = common.getSelLNServerUrl() + '/v1/payreq/' + payment;
  return request(options).then(function(res) {
    logger.log({level: 'DEBUG', fileName: 'PayReq', msg: 'Description', data: res.description});
    return res;
  })
  .catch(err => {});
}

exports.decodePayment = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'PayRequest', msg: 'Decoding Payment..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/payreq/' + req.params.payRequest;
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.log({level: 'DEBUG', fileName: 'PayReq', msg: 'Payment Decode Received', data: body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.log({level: 'ERROR', fileName: 'PayReq', msg: 'Payment Decode Error 1', error: body.error});
      res.status(500).json({
        message: "Payment Request Decode Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'PayRequest', msg: 'Payment Decoded'});
      res.status(200).json(body);
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
    logger.log({level: 'ERROR', fileName: 'PayReq', msg: 'Payment Decode Error 2', error: err.error});
    return res.status(500).json({
      message: "Payment Request Decode Failed!",
      error: err.error
    });
  });
};

exports.decodePayments = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'PayRequest', msg: 'Decoding Payments List..'});
  options = common.getOptions();
  if (req.body.payments) {
    let paymentsArr = req.body.payments.split(',');
    return Promise.all(paymentsArr.map(payment => decodePaymentFromPaymentRequest(payment)))
    .then(function(values) {
      logger.log({level: 'DEBUG', fileName: 'PayReq', msg: 'Decoded Payments', data: values});
      logger.log({level: 'INFO', fileName: 'PayRequest', msg: 'Payment List Decoded'});
      res.status(200).json(values);
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.log({level: 'ERROR', fileName: 'PayReq', msg: 'Decode Payments Error', error: err});
      return res.status(500).json({
        message: "Decode Payments Failed!",
        error: err.error
      });
    });    
  } else {
    logger.log({level: 'INFO', fileName: 'PayRequest', msg: 'Empty Payment List Decoded'});
    res.status(200).json([]);
  }
};

var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getPayments = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'Getting Payments List..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/payments?max_payments=' + req.query.max_payments + '&index_offset=' + req.query.index_offset + '&reversed=' + req.query.reversed;
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Payment List Received', data: body_str});
    if (!body || search_idx > -1 || body.error) {
      logger.log({level: 'ERROR', fileName: 'Payments', msg: 'List Payments Error', error: body.error});
      res.status(500).json({
        message: "Payments List Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if (body.payments && body.payments.length > 0) {
        body.payments = common.sortDescByKey(body.payments, 'creation_date');
      }
      logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Payments After Sort', data: body});
      logger.log({level: 'INFO', fileName: 'Payments', msg: 'Payments List Received'});
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
    logger.log({level: 'ERROR', fileName: 'Payments', msg: 'List Payments Error', error: err});
    return res.status(500).json({
      message: "Payments List Failed!",
      error: err.error
    });
  });
};

exports.getAllLightningTransactions = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'Getting All Lightning Transactions..'});
  const options1 = JSON.parse(JSON.stringify(common.getOptions()))
  const options2 = JSON.parse(JSON.stringify(common.getOptions()))
  options1.url = common.getSelLNServerUrl() + '/v1/payments?max_payments=1000000&index_offset=0&reversed=true';
  options2.url = common.getSelLNServerUrl() + '/v1/invoices?num_max_invoices=1000000&index_offset=0&reversed=true';
  logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'All Payments Options', data: options1});
  logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'All Invoices Options', data: options2});
  return Promise.all([request(options1), request(options2)]).then(function(values) {
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Payments & Invoices Received'});
    res.status(200).json({paymentsAll: values[0], invoicesAll: values[1]});
  }).catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Payments', msg: 'All Lightning Transactions Error', error: err});
    return res.status(500).json({
      message: "All Lightning Transactions Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

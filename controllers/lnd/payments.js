var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/payments?max_payments=' + req.query.max_payments + '&index_offset=' + req.query.index_offset + '&reversed=' + req.query.reversed;
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
      if (body.payments && body.payments.length > 0) {
        body.payments = common.sortDescByKey(body.payments, 'creation_date');
      }
      logger.info({fileName: 'Payments', msg: 'Payments After Sort: ' + JSON.stringify(body)});
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
    logger.error({fileName: 'Payments', lineNum: 36, msg: 'List Payments Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Payments List Failed!",
      error: err.error
    });
  });
};

exports.getAllLightningTransactions = (req, res, next) => {
  const options1 = JSON.parse(JSON.stringify(common.getOptions()))
  const options2 = JSON.parse(JSON.stringify(common.getOptions()))
  options1.url = common.getSelLNServerUrl() + '/v1/payments?max_payments=1000000&index_offset=0&reversed=true';
  options2.url = common.getSelLNServerUrl() + '/v1/invoices?num_max_invoices=1000000&index_offset=0&reversed=true';
  logger.info({fileName: 'Payments', msg: 'All Payments Options: ' + JSON.stringify(options1)});
  logger.info({fileName: 'Payments', msg: 'All Invoices Options: ' + JSON.stringify(options2)});
  Promise.all([request(options1), request(options2)]).then(function(values) {
    res.status(200).json({paymentsAll: values[0], invoicesAll: values[1]});
  }).catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Payments', lineNum: 84, msg: 'All Lightning Transactions Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "All Lightning Transactions Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

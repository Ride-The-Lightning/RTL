var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.listInvoices = (req, res, next) => {
  options = common.getOptions();
  const labelQuery = req.query.label ? '?label=' + req.query.label : '';
  options.url = common.getSelLNServerUrl() + '/invoice/listInvoices' + labelQuery;
  request(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + body});
    if ( body.invoices && body.invoices.length > 0) {
      body.invoices.forEach(invoice => {
        invoice.paid_at_str =  (!invoice.paid_at) ? '' : common.convertTimestampToDate(invoice.paid_at);
        invoice.expires_at_str =  (!invoice.expires_at) ? '' : common.convertTimestampToDate(invoice.expires_at);
      });
      body.invoices = common.sortDescByKey(body.invoices, 'expires_at');
    }
    logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Invoice', lineNum: 67, msg: 'List Invoice Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Invoice Info failed!",
      error: err.error
    });
  });
};

exports.addInvoice = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/invoice/genInvoice';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Add Invoice Responce: ' + JSON.stringify(body)});
    res.status(201).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Invoice', lineNum: 98, msg: 'Add Invoice Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Add Invoice Failed!",
      error: err.error
    });
  });
};

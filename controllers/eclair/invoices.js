var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.listInvoices = (req, res, next) => {
  options = common.getOptions();
  options.form = {};
  options1 = JSON.parse(JSON.stringify(options));
  options1.url = common.getSelLNServerUrl() + '/listinvoices';
  options1.form = {};
  options2 = JSON.parse(JSON.stringify(options));
  options2.url = common.getSelLNServerUrl() + '/listpendinginvoices';
  options2.form = {};
  Promise.all([request(options1), request(options2)]).then(function(body) {
    logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + JSON.stringify(body)});
    let invoices = (!body[0] || body[0].length <= 0) ? [] : body[0];
    let pendingInvoices = (!body[1] || body[1].length <= 0) ? [] : body[1];
    if (invoices && invoices.length > 0) {
      invoices.forEach(invoice => {
        invoice.timestampStr =  (!invoice.timestamp) ? '' : common.convertTimestampToDate(invoice.timestamp);
        invoice.expiresAt =  (!invoice.expiry) ? null : (+invoice.timestamp + +invoice.expiry);
        invoice.expiresAtStr =  (!invoice.expiresAt) ? '' : common.convertTimestampToDate(invoice.expiresAt);
        invoice.status = pendingInvoices.find(pendingInvoice => invoice.serialized === pendingInvoice.serialized) ? 'unpaid' : 'paid';
      });
      body = common.sortDescByKey(invoices, 'expiresAt');
    }
    logger.info({fileName: 'Invoice', msg: 'Final Invoices List: ' + JSON.stringify(invoices)});
    res.status(200).json(invoices);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Invoice', lineNum: 29, msg: 'List Invoices Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Fetching Invoices failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.createInvoice = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/createinvoice';
  options.form = req.body;
  request.post(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Create Invoice Response: ' + JSON.stringify(body)});
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
    logger.error({fileName: 'Invoice', lineNum: 98, msg: 'Create Invoice Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Create Invoice Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

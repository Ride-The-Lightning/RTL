var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};
var pendingInvoices = [];

getReceivedPaymentInfo = (invoice) => {
  let idx = -1;
  invoice.expiresAt =  (!invoice.expiry) ? null : (+invoice.timestamp + +invoice.expiry);
  if (invoice.amount) { invoice.amount = Math.round(invoice.amount/1000); }
  idx = pendingInvoices.findIndex(pendingInvoice => invoice.serialized === pendingInvoice.serialized);
  if (idx < 0) {
    options.url = common.getSelLNServerUrl() + '/getreceivedinfo';
    options.form = { paymentHash: invoice.paymentHash };
    return request(options).then(response => {
      invoice.status = response.status.type;
      if (response.status && response.status.type === 'received') {
        invoice.amountSettled = response.status.amount ? Math.round(response.status.amount/1000) : 0;
        invoice.receivedAt = response.status.receivedAt ? Math.round(response.status.receivedAt / 1000) : 0;
      }
      return invoice;
    }).catch(err => {
      invoice.status = 'unknown';
      return invoice;
    });
  } else {
    pendingInvoices.splice(idx, 1);
    invoice.status = 'unpaid';      
    return invoice;
  }
}

exports.listInvoices = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Getting List Invoices...'});
  options = common.getOptions();
  options.form = {};
  options1 = JSON.parse(JSON.stringify(options));
  options1.url = common.getSelLNServerUrl() + '/listinvoices';
  options1.form = {};
  options2 = JSON.parse(JSON.stringify(options));
  options2.url = common.getSelLNServerUrl() + '/listpendinginvoices';
  options2.form = {};
  if (common.read_dummy_data) {
    common.getDummyData('Invoices').then(function(body) { 
      let invoices = (!body[0] || body[0].length <= 0) ? [] : body[0];
      pendingInvoices = (!body[1] || body[1].length <= 0) ? [] : body[1];
      return Promise.all(invoices.map(invoice => getReceivedPaymentInfo(invoice)))
      .then(values => {
        body = common.sortDescByKey(invoices, 'expiresAt');
        res.status(200).json(invoices);
      });
    });
  } else {
    return Promise.all([request(options1), request(options2)])
    .then(body => {
      logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received: ' + JSON.stringify(body)});
      let invoices = (!body[0] || body[0].length <= 0) ? [] : body[0];
      pendingInvoices = (!body[1] || body[1].length <= 0) ? [] : body[1];
      if (invoices && invoices.length > 0) {
        return Promise.all(invoices.map(invoice => getReceivedPaymentInfo(invoice)))
        .then(values => {
          body = common.sortDescByKey(invoices, 'expiresAt');
          logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Final Invoices List: ' + JSON.stringify(invoices)});
          logger.log({level: 'INFO', fileName: 'Invoices', msg: 'List Invoices Received.'});
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
          logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'List Invoices Error: ' + JSON.stringify(err)});
          return res.status(err.statusCode ? err.statusCode : 500).json({
            message: "Fetching Invoices failed!",
            error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
          });
        });    
      } else {
        logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Empty List Invoice Received.'});
        res.status(200).json([]);      
      }
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers.authorization) {
        delete err.options.headers.authorization;
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
        delete err.response.request.headers.authorization;
      }
      logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'List Invoices Error: ' + JSON.stringify(err)});
      return res.status(err.statusCode ? err.statusCode : 500).json({
        message: "Fetching Invoices failed!",
        error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
      });
    });
  }
};

exports.createInvoice = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Creating Invoice...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/createinvoice';
  options.form = req.body;
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Create Invoice Response: ' + JSON.stringify(body)});
    if (body.amount) { body.amount = Math.round(body.amount/1000); }
    logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Invoice Created.'});
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
    logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'Create Invoice Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Create Invoice Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

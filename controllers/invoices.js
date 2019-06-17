var request = require('request-promise');
var common = require('../common');
var logger = require('./logger');
var options = {};

exports.getInvoice = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/invoice/' + req.params.rHashStr;
  request(options).then((body) => {
    logger.info('\r\nInvoice: 8: ' + JSON.stringify(Date.now()) + ': INFO: Invoice Info Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching Invoice Info Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    }
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fetching Invoice Info Failed!",
      error: err.error
    });
  });  
};

exports.listInvoices = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/invoices?num_max_invoices=' + req.query.num_max_invoices + '&index_offset=' + req.query.index_offset + 
  '&reversed=' + req.query.reversed;
  request(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    logger.info('\r\nInvoice: 30: ' + JSON.stringify(Date.now()) + ': INFO: Invoices List Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching Invoice Info failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined !== body.invoices) {
        body.invoices.forEach(invoice => {
          invoice.creation_date_str =  (undefined === invoice.creation_date) ? '' : common.convertTimestampToDate(invoice.creation_date);
          invoice.settle_date_str =  (undefined === invoice.settle_date) ? '' : common.convertTimestampToDate(invoice.settle_date);
          invoice.btc_value = (undefined === invoice.value) ? 0 : common.convertToBTC(invoice.value);
          invoice.btc_amt_paid_sat =  (undefined === invoice.amt_paid_sat) ? 0 : common.convertToBTC(invoice.amt_paid_sat);
        });
        body.invoices = common.sortDescByKey(body.invoices, 'creation_date');
      }
      logger.info('\r\nInvoice: 45: ' + JSON.stringify(Date.now()) + ': INFO: Invoices List Received: ' + JSON.stringify(body));
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching Invoice Info failed!",
      error: err.error
    });
  });
};

exports.addInvoice = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/invoices';
  options.form = JSON.stringify({ 
    memo: req.body.memo,
    value: req.body.amount,
    private: req.body.private,
    expiry: req.body.expiry
  });
  request.post(options).then((body) => {
    logger.info('\r\nInvoice: 64: ' + JSON.stringify(Date.now()) + ': INFO: Add Invoice Responce: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Add Invoice Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Add Invoice Failed!",
      error: err.error
    });
  });
};

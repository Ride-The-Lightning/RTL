var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getInvoice = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/invoice/' + req.params.rHashStr;
  request(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Invoice Info Received: ' + JSON.stringify(body)});
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
  const labelQuery = req.query.label ? '?label=' + req.query.label : '';
  options.url = common.getSelLNServerUrl() + '/invoice/listInvoices' + labelQuery;
  request(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + body});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching Invoice Info failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined !== body.invoices) {
        body.invoices.forEach(invoice => {
          invoice.paid_at_str =  (undefined === invoice.paid_at) ? '' : common.convertTimestampToDate(invoice.paid_at);
          invoice.expires_at_str =  (undefined === invoice.expires_at) ? '' : common.convertTimestampToDate(invoice.expires_at);
        });
        body.invoices = common.sortDescByKey(body.invoices, 'expires_at');
      }
      logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + JSON.stringify(body)});
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
  options.url = common.getSelLNServerUrl() + '/invoices';
  options.form = JSON.stringify({ 
    memo: req.body.memo,
    value: req.body.amount,
    private: req.body.private,
    expiry: req.body.expiry
  });
  request.post(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Add Invoice Responce: ' + JSON.stringify(body)});
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

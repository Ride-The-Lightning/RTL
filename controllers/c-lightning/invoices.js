var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.deleteExpiredInvoice = (req, res, next) => {
  options = common.getOptions();
  const queryStr = req.query.maxExpiry ? '?maxexpiry=' + req.query.maxExpiry : '';
  options.url = common.getSelLNServerUrl() + '/invoice/delExpiredInvoice' + queryStr;
  request.delete(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Invoices Deleted: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Deleting Invoice Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    }
    res.status(204).json({status: 'Invoice Deleted Successfully'});
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Deleting Invoice Failed!",
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
  options.url = common.getSelLNServerUrl() + '/invoice/genInvoice';
  options.body = req.body;
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

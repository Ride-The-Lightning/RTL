var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.deleteExpiredInvoice = (req, res, next) => {
  options = common.getOptions();
  const queryStr = req.query.maxExpiry ? '?maxexpiry=' + req.query.maxExpiry : '';
  options.url = common.getSelLNServerUrl() + '/v1/invoice/delExpiredInvoice' + queryStr;
  request.delete(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Invoices Deleted: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Invoice', lineNum: 13, msg: 'Invoice Delete Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Deleting Invoice Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    res.status(204).json({status: 'Invoice Deleted Successfully'});
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.error({fileName: 'Invoice', lineNum: 28, msg: 'Invoice Delete Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Deleting Invoice Failed!",
      error: err.error
    });
  });  
};

exports.listInvoices = (req, res, next) => {
  options = common.getOptions();
  const labelQuery = req.query.label ? '?label=' + req.query.label : '';
  options.url = common.getSelLNServerUrl() + '/v1/invoice/listInvoices' + labelQuery;
  request(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + body});
    if(!body || body.error) {
      logger.error({fileName: 'Invoice', lineNum: 43, msg: 'List Invoice Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Invoice Info failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      if ( body.invoices && body.invoices.length > 0) {
        body.invoices.forEach(invoice => {
          invoice.paid_at_str =  (!invoice.paid_at) ? '' : common.convertTimestampToDate(invoice.paid_at);
          invoice.expires_at_str =  (!invoice.expires_at) ? '' : common.convertTimestampToDate(invoice.expires_at);
        });
        body.invoices = common.sortDescByKey(body.invoices, 'expires_at');
      }
      logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + JSON.stringify(body)});
      res.status(200).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
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
  options.url = common.getSelLNServerUrl() + '/v1/invoice/genInvoice';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Add Invoice Responce: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Invoice', lineNum: 82, msg: 'Add Invoice Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Add Invoice Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.error({fileName: 'Invoice', lineNum: 98, msg: 'Add Invoice Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Add Invoice Failed!",
      error: err.error
    });
  });
};

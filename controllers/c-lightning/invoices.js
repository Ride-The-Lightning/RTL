var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.deleteExpiredInvoice = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Deleting Expired Invoices..'});
  options = common.getOptions();
  const queryStr = req.query.maxExpiry ? '?maxexpiry=' + req.query.maxExpiry : '';
  options.url = common.getSelLNServerUrl() + '/v1/invoice/delExpiredInvoice' + queryStr;
  request.delete(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices Deleted', data: body});
    if (!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'Invoice Delete Error', error: body.error});
      res.status(500).json({
        message: "Deleting Invoice Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Expired Invoices Deleted'});
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
    logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'Invoice Delete Error', error: err});
    return res.status(500).json({
      message: "Deleting Invoice Failed!",
      error: err.error
    });
  });  
};

exports.listInvoices = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Getting Invoices..'});
  options = common.getOptions();
  const labelQuery = req.query.label ? '?label=' + req.query.label : '';
  options.url = common.getSelLNServerUrl() + '/v1/invoice/listInvoices' + labelQuery;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body});
    if (!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'List Invoice Error', error: body.error});
      res.status(500).json({
        message: "Fetching Invoice Info failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      if ( body.invoices && body.invoices.length > 0) {
        body.invoices = common.sortDescByKey(body.invoices, 'expires_at');
      }
      logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body});
      logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Invoices Received'});
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
    logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'List Invoice Error', error: err});
    return res.status(500).json({
      message: "Fetching Invoice Info failed!",
      error: err.error
    });
  });
};

exports.addInvoice = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Creating Invoice..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/invoice/genInvoice';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Add Invoice Responce', data: body});
    if (!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'Add Invoice Error', error: body.error});
      res.status(500).json({
        message: "Add Invoice Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Invoice Created'});
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
    logger.log({level: 'ERROR', fileName: 'Invoice', msg: 'Add Invoice Error', error: err});
    return res.status(500).json({
      message: "Add Invoice Failed!",
      error: err.error
    });
  });
};

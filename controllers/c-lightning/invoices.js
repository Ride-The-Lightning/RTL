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
    logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Expired Invoices Deleted'});
    res.status(204).json({status: 'Invoice Deleted Successfully'});
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Invoice', 'Delete Invoice Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });  
};

exports.listInvoices = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Getting Invoices..'});
  options = common.getOptions();
  const labelQuery = req.query.label ? '?label=' + req.query.label : '';
  options.url = common.getSelLNServerUrl() + '/v1/invoice/listInvoices' + labelQuery;
  logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List URL', data: options.url});
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body});
    if ( body.invoices && body.invoices.length > 0) {
      body.invoices = common.sortDescByKey(body.invoices, 'expires_at');
    }
    logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body});
    logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Invoices Received'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Invoice', 'List Invoices Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

exports.addInvoice = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Creating Invoice..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/invoice/genInvoice';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Invoice', msg: 'Add Invoice Responce', data: body});
    logger.log({level: 'INFO', fileName: 'Invoices', msg: 'Invoice Created'});
    res.status(201).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Invoice', 'Add Invoice Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const deleteExpiredInvoice = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Deleting Expired Invoices..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/delexpiredinvoice';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoices Deleted', data: body });
    res.status(204).json({ status: 'Invoice Deleted Successfully' });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Invoice', 'Delete Invoice Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listInvoices = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Getting Invoices..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/listinvoices';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List URL', data: options.url });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Invoice', 'List Invoices Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const addInvoice = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Creating Invoice..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/invoice';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Created', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Invoice', 'Add Invoice Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getPayments = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Getting Payments List..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/payments?max_payments=' + req.query.max_payments + '&index_offset=' + req.query.index_offset + '&reversed=' + req.query.reversed;
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Payments', msg: 'Payment List Received', data: body });
    if (body.payments && body.payments.length > 0) {
      body.payments = common.sortDescByKey(body.payments, 'creation_date');
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Payments', msg: 'Payments After Sort', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payments List Received' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Payments', 'List Payments Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getAllLightningTransactions = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Getting All Lightning Transactions..' });
  const options1 = JSON.parse(JSON.stringify(common.getOptions(req)));
  const options2 = JSON.parse(JSON.stringify(common.getOptions(req)));
  options1.url = req.session.selectedNode.ln_server_url + '/v1/payments?max_payments=1000000&index_offset=0&reversed=true';
  options2.url = req.session.selectedNode.ln_server_url + '/v1/invoices?num_max_invoices=1000000&index_offset=0&reversed=true';
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Payments', msg: 'All Payments Options', data: options1 });
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Payments', msg: 'All Invoices Options', data: options2 });
  return Promise.all([request(options1), request(options2)]).then((values) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payments & Invoices Received' });
    res.status(200).json({ paymentsAll: values[0], invoicesAll: values[1] });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Payments', 'All Lightning Transactions Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

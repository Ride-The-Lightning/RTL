import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
let pendingInvoices = [];

export const getReceivedPaymentInfo = (lnServerUrl, invoice) => {
  let idx = -1;
  invoice.expiresAt = !invoice.expiry ? null : +invoice.timestamp + +invoice.expiry;
  if (invoice.amount) {
    invoice.amount = Math.round(invoice.amount / 1000);
  }
  idx = pendingInvoices.findIndex((pendingInvoice) => invoice.serialized === pendingInvoice.serialized);
  if (idx < 0) {
    options.url = lnServerUrl + '/getreceivedinfo';
    options.form = { paymentHash: invoice.paymentHash };
    return request(options)
      .then((response) => {
        invoice.status = response.status.type;
        if (response.status && response.status.type === 'received') {
          invoice.amountSettled = response.status.amount ? Math.round(response.status.amount / 1000) : 0;
          invoice.receivedAt = response.status.receivedAt ? Math.round(response.status.receivedAt / 1000) : 0;
        }
        return invoice;
      })
      .catch((err) => {
        invoice.status = 'unknown';
        return invoice;
      });
  } else {
    pendingInvoices.splice(idx, 1);
    invoice.status = 'unpaid';
    return invoice;
  }
};

export const getInvoice = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Invoice..' });
  options = common.getOptions(req);
  if (options.error) {
    return res.status(options.statusCode).json({ message: options.message, error: options.error });
  }
  options.url = req.session.selectedNode.ln_server_url + '/getinvoice';
  options.form = { paymentHash: req.params.paymentHash };
  request
    .post(options)
    .then((body) => {
      logger.log({
        selectedNode: req.session.selectedNode,
        level: 'INFO',
        fileName: 'Invoice',
        msg: 'Invoice Found',
        data: body
      });
      const current_time = Math.round(new Date(Date.now()).getTime() / 1000);
      body.amount = body.amount ? body.amount / 1000 : 0;
      body.expiresAt = body.expiresAt ? body.expiresAt : body.timestamp + body.expiry;
      body.status = body.status ? body.status : +body.expiresAt < current_time ? 'expired' : 'unknown';
      res.status(200).json(body);
    })
    .catch((errRes) => {
      const err = common.handleError(errRes, 'Invoices', 'Get Invoice Error', req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

export const listInvoices = (req, res, next) => {
  logger.log({
    selectedNode: req.session.selectedNode,
    level: 'INFO',
    fileName: 'Invoices',
    msg: 'Getting List Invoices..'
  });
  options = common.getOptions(req);
  if (options.error) {
    return res.status(options.statusCode).json({ message: options.message, error: options.error });
  }
  options.form = {};
  const options1 = JSON.parse(JSON.stringify(options));
  options1.url = req.session.selectedNode.ln_server_url + '/listinvoices';
  options1.form = {};
  const options2 = JSON.parse(JSON.stringify(options));
  options2.url = req.session.selectedNode.ln_server_url + '/listpendinginvoices';
  options2.form = {};
  if (common.read_dummy_data) {
    return common.getDummyData('Invoices', req.session.selectedNode.ln_implementation).then((body) => {
      const invoices = !body[0] || body[0].length <= 0 ? [] : body[0];
      pendingInvoices = !body[1] || body[1].length <= 0 ? [] : body[1];
      return Promise.all(
        invoices.map((invoice) => getReceivedPaymentInfo(req.session.selectedNode.ln_server_url, invoice))
      ).then((values) => {
        body = common.sortDescByKey(invoices, 'expiresAt');
        return res.status(200).json(invoices);
      });
    });
  } else {
    return Promise.all([request(options1), request(options2)])
      .then((body) => {
        logger.log({
          selectedNode: req.session.selectedNode,
          level: 'DEBUG',
          fileName: 'Invoice',
          msg: 'Invoices List Received',
          data: body
        });
        const invoices = !body[0] || body[0].length <= 0 ? [] : body[0];
        pendingInvoices = !body[1] || body[1].length <= 0 ? [] : body[1];
        if (invoices && invoices.length > 0) {
          return Promise.all(
            invoices.map((invoice) => getReceivedPaymentInfo(req.session.selectedNode.ln_server_url, invoice))
          )
            .then((values) => {
              body = common.sortDescByKey(invoices, 'expiresAt');
              logger.log({
                selectedNode: req.session.selectedNode,
                level: 'INFO',
                fileName: 'Invoices',
                msg: 'Sorted Invoices List Received',
                data: invoices
              });
              return res.status(200).json(invoices);
            })
            .catch((errRes) => {
              const err = common.handleError(errRes, 'Invoices', 'List Invoices Error', req.session.selectedNode);
              return res.status(err.statusCode).json({ message: err.message, error: err.error });
            });
        } else {
          logger.log({
            selectedNode: req.session.selectedNode,
            level: 'INFO',
            fileName: 'Invoices',
            msg: 'Empty List Invoice Received'
          });
          return res.status(200).json([]);
        }
      })
      .catch((errRes) => {
        const err = common.handleError(errRes, 'Invoices', 'List Invoices Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  }
};

export const createInvoice = (req, res, next) => {
  logger.log({
    selectedNode: req.session.selectedNode,
    level: 'INFO',
    fileName: 'Invoices',
    msg: 'Creating Invoice..'
  });
  options = common.getOptions(req);
  if (options.error) {
    return res.status(options.statusCode).json({ message: options.message, error: options.error });
  }
  options.url = req.session.selectedNode.ln_server_url + '/createinvoice';
  options.form = req.body;
  request
    .post(options)
    .then((body) => {
      logger.log({
        selectedNode: req.session.selectedNode,
        level: 'INFO',
        fileName: 'Invoice',
        msg: 'Invoice Created',
        data: body
      });
      if (body.amount) {
        body.amount = Math.round(body.amount / 1000);
      }
      res.status(201).json(body);
    })
    .catch((errRes) => {
      const err = common.handleError(errRes, 'Invoices', 'Create Invoice Error', req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

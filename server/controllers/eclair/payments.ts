import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { CommonSelectedNode } from '../../models/config.model.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getSentInfoFromPaymentRequest = (selNode: CommonSelectedNode, payment) => {
  options.url = selNode.ln_server_url + '/getsentinfo';
  options.form = { paymentHash: payment };
  return request.post(options).then((body) => {
    logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Payments', msg: 'Payment Sent Information', data: body });
    body.forEach((sentPayment) => {
      if (sentPayment.amount) { sentPayment.amount = Math.round(sentPayment.amount / 1000); }
      if (sentPayment.recipientAmount) { sentPayment.recipientAmount = Math.round(sentPayment.recipientAmount / 1000); }
    });
    return body;
  }).catch((err) => err);
};

export const getQueryNodes = (selNode: CommonSelectedNode, nodeIds) => {
  options.url = selNode.ln_server_url + '/nodes';
  options.form = { nodeIds: nodeIds };
  return request.post(options).then((nodes) => {
    logger.log({ selectedNode: selNode, level: 'INFO', fileName: 'Payments', msg: 'Query Nodes', data: nodes });
    return nodes;
  }).catch((err) => []);
};

export const decodePayment = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Decoding Payment..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/parseinvoice';
  options.form = { invoice: req.params.invoice };
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payment Decoded', data: body });
    if (body.amount) { body.amount = Math.round(body.amount / 1000); }
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Payments', 'Decode Payment Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const postPayment = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Paying Invoice..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/payinvoice';
  options.form = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Send Payment Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Invoice Paid', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Payments', 'Send Payment Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const queryPaymentRoute = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Querying Payment Route..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/findroutetonode';
  options.form = {
    nodeId: req.query.nodeId,
    amountMsat: req.query.amountMsat
  };
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Query Payment Route Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Query Payment Route', data: body });
    if (body && body.length) {
      const queryRoutes = [];
      return getQueryNodes(req.session.selectedNode, body).then((hopsWithAlias) => {
        let foundPeer = null;
        body.map((hop) => {
          foundPeer = hopsWithAlias.find((hopWithAlias) => hop === hopWithAlias.nodeId);
          queryRoutes.push({ nodeId: hop, alias: foundPeer ? foundPeer.alias : '' });
          return hop;
        });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Query Routes with Alias', data: queryRoutes });
        res.status(200).json(queryRoutes);
      });
    } else {
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Empty Payment Route Information Received' });
      res.status(200).json([]);
    }
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Payments', 'Query Route Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getSentPaymentsInformation = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Getting Sent Payment Information..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  if (req.body.payments) {
    const paymentsArr = req.body.payments.split(',');
    return Promise.all(paymentsArr.map((payment) => getSentInfoFromPaymentRequest(req.session.selectedNode, payment))).
      then((values) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payment Sent Information', data: values });
        return res.status(200).json(values);
      }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Sent Payment Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  } else {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Empty Sent Payment Information Received' });
    return res.status(200).json([]);
  }
};

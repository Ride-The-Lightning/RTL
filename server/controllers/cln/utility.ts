import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { CommonSelectedNode } from '../../models/config.model.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const decodePaymentFromPaymentRequest = (selNode: CommonSelectedNode, payment) => {
  options.url = selNode.ln_server_url + '/v1/utility/decode/' + payment;
  return request(options).then((res) => {
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Payments', msg: 'Payment Decode Received', data: res });
    return res;
  }).catch((err) => { });
};

export const decodePayments = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Decoding Payments List..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  if (req.body.payments) {
    const paymentsArr = req.body.payments.split(',');
    return Promise.all(paymentsArr.map((payment) => decodePaymentFromPaymentRequest(req.session.selectedNode, payment))).
      then((values) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payment List Decoded', data: values });
        res.status(200).json(values);
      }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Decode Payments Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  } else {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Empty Payment List Decoded' });
    return res.status(200).json([]);
  }
};

export const decodePayment = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Decoding Payment..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/utility/decode/' + req.params.payReq;
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payment Decoded', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Payments', 'Decode Payment Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const signMessage = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Message', msg: 'Signing Message..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/utility/signMessage';
  options.form = { message: req.body.message };
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Message', msg: 'Message Signed', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Message', 'Sign Message Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const verifyMessage = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Message', msg: 'Verifying Message..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/utility/checkMessage/' + req.body.message + '/' + req.body.signature;
  request.get(options, (error, response, body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Message', msg: 'Message Verified', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Message', 'Verify Message Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listConfigs = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Utility', msg: 'List Configs..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/utility/listConfigs';
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Utility', msg: 'List Configs Received', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Utility', 'List Configs Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const decodePayment = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Decoding Payment..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/decode';
  options.body = req.body;
  request.post(options).then((body) => {
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
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/signmessage';
  options.body = req.body;
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
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/checkmessage';
  options.body = req.body;
  request.post(options, (error, response, body) => {
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
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/listconfigs';
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Utility', msg: 'List Configs Received', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Utility', 'List Configs Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

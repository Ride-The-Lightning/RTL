import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const decodePaymentFromPaymentRequest = (lnServerUrl, payment) => {
  options.url = lnServerUrl + '/v1/payreq/' + payment;
  return request(options).then((res) => {
    logger.log({ selectedNode: null, level: 'DEBUG', fileName: 'PayReq', msg: 'Description', data: res.description });
    return res;
  }).catch((err) => { });
};

export const decodePayment = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'PayRequest', msg: 'Decoding Payment..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/payreq/' + req.params.payRequest;
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'PayReq', msg: 'Payment Decode Received', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'PayRequest', msg: 'Payment Decoded' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'PayRequest', 'Decode Payment Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const decodePayments = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'PayRequest', msg: 'Decoding Payments List..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  if (req.body.payments) {
    const paymentsArr = req.body.payments.split(',');
    return Promise.all(paymentsArr.map((payment) => decodePaymentFromPaymentRequest(req.session.selectedNode.ln_server_url, payment))).
      then((values) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'PayReq', msg: 'Decoded Payments', data: values });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'PayRequest', msg: 'Payment List Decoded' });
        res.status(200).json(values);
      }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'PayRequest', 'Decode Payments Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  } else {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'PayRequest', msg: 'Empty Payment List Decoded' });
    return res.status(200).json([]);
  }
};

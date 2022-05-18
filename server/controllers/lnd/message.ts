import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const signMessage = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Message', msg: 'Signing Message..' });
  options = common.getOptions(req);
  if (options.error) {
    return res.status(options.statusCode).json({ message: options.message, error: options.error });
  }
  options.url = req.session.selectedNode.ln_server_url + '/v1/signmessage';
  options.form = JSON.stringify({
    msg: Buffer.from(req.body.message).toString('base64')
  });
  request
    .post(options)
    .then((body) => {
      logger.log({
        selectedNode: req.session.selectedNode,
        level: 'INFO',
        fileName: 'Message',
        msg: 'Message Signed',
        data: body
      });
      res.status(201).json(body);
    })
    .catch((errRes) => {
      const err = common.handleError(errRes, 'Messages', 'Sign Message Error', req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

export const verifyMessage = (req, res, next) => {
  logger.log({
    selectedNode: req.session.selectedNode,
    level: 'INFO',
    fileName: 'Message',
    msg: 'Verifying Message..'
  });
  options = common.getOptions(req);
  if (options.error) {
    return res.status(options.statusCode).json({ message: options.message, error: options.error });
  }
  options.url = req.session.selectedNode.ln_server_url + '/v1/verifymessage';
  options.form = JSON.stringify({
    msg: Buffer.from(req.body.message).toString('base64'),
    signature: req.body.signature
  });
  request
    .post(options)
    .then((body) => {
      logger.log({
        selectedNode: req.session.selectedNode,
        level: 'INFO',
        fileName: 'Message',
        msg: 'Message Verified',
        data: body
      });
      res.status(201).json(body);
    })
    .catch((errRes) => {
      const err = common.handleError(errRes, 'Messages', 'Verify Message Error', req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

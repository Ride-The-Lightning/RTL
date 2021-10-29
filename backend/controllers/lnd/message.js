import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const signMessage = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Message', msg: 'Signing Message..' });
    options = common.getOptions(req);
    options.url = req.session.selectedNode.ln_server_url + '/v1/signmessage';
    options.form = JSON.stringify({
        msg: Buffer.from(req.body.message).toString('base64')
    });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Messages', msg: 'Message Signed', data: body });
        logger.log({ level: 'INFO', fileName: 'Message', msg: 'Message Signed' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Messages', 'Sign Message Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const verifyMessage = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Message', msg: 'Verifying Message..' });
    options = common.getOptions(req);
    options.url = req.session.selectedNode.ln_server_url + '/v1/verifymessage';
    options.form = JSON.stringify({
        msg: Buffer.from(req.body.message).toString('base64'),
        signature: req.body.signature
    });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Messages', msg: 'Message Verified', data: body });
        logger.log({ level: 'INFO', fileName: 'Message', msg: 'Message Verified' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Messages', 'Verify Message Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

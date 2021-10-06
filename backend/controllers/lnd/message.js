"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMessage = exports.signMessage = void 0;
const request = require("request-promise");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
let options = null;
const logger = logger_1.Logger;
const common = common_1.Common;
const signMessage = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Message', msg: 'Signing Message..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/signmessage';
    options.form = JSON.stringify({
        msg: Buffer.from(req.body.message).toString('base64')
    });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Messages', msg: 'Message Signed', data: body });
        logger.log({ level: 'INFO', fileName: 'Message', msg: 'Message Signed' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Messages', 'Sign Message Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.signMessage = signMessage;
const verifyMessage = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Message', msg: 'Verifying Message..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/verifymessage';
    options.form = JSON.stringify({
        msg: Buffer.from(req.body.message).toString('base64'),
        signature: req.body.signature
    });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Messages', msg: 'Message Verified', data: body });
        logger.log({ level: 'INFO', fileName: 'Message', msg: 'Message Verified' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Messages', 'Verify Message Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.verifyMessage = verifyMessage;

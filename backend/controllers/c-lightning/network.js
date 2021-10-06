"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeRates = exports.listChannel = exports.listNode = exports.getRoute = void 0;
const request = require("request-promise");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
let options = null;
const logger = logger_1.Logger;
const common = common_1.Common;
const getRoute = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Network', msg: 'Getting Network Routes..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/network/getRoute/' + req.params.destPubkey + '/' + req.params.amount;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Network', msg: 'Query Routes Received', data: body });
        logger.log({ level: 'INFO', fileName: 'Network', msg: 'Network Routes Received' });
        res.status(200).json({ routes: body });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Query Routes Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getRoute = getRoute;
const listNode = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Network', msg: 'Node Lookup..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/network/listNode/' + req.params.id;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Network', msg: 'Node Lookup', data: body });
        logger.log({ level: 'INFO', fileName: 'Network', msg: 'Node Lookup Finished' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Node Lookup Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.listNode = listNode;
const listChannel = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Network', msg: 'Channel Lookup..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/network/listChannel/' + req.params.channelShortId;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Network', msg: 'Channel Lookup', data: body });
        logger.log({ level: 'INFO', fileName: 'Network', msg: 'Channel Lookup Finished' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Channel Lookup Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.listChannel = listChannel;
const feeRates = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Network', msg: 'Getting Network Fee Rates..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/network/feeRates/' + req.params.feeRateStyle;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Network', msg: 'Network Fee Rates Received for ' + req.params.feeRateStyle, data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Fee Rates Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.feeRates = feeRates;

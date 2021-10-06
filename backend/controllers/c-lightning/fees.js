"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFees = void 0;
const request = require("request-promise");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
let options = null;
const logger = logger_1.Logger;
const common = common_1.Common;
const getFees = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Fees', msg: 'Getting Fees..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/getFees';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Fees', msg: 'Fee Received', data: body });
        if (!body.feeCollected) {
            body.feeCollected = 0;
        }
        logger.log({ level: 'INFO', fileName: 'Fees', msg: 'Fees Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Fees', 'Get Fees Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getFees = getFees;

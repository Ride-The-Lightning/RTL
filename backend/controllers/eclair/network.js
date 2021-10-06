"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodes = void 0;
const request = require("request-promise");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
let options = null;
const logger = logger_1.Logger;
const common = common_1.Common;
const getNodes = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Network', msg: 'Node Lookup..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/nodes';
    options.form = { nodeIds: req.params.id };
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Network', msg: 'Node Lookup', data: body });
        logger.log({ level: 'INFO', fileName: 'Network', msg: 'Node Lookup Finished' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Node Lookup Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getNodes = getNodes;

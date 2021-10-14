import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getBalance = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Balance', msg: 'Getting Balance..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/getBalance';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Balance', msg: 'Balance Received', data: body });
        if (!body.totalBalance) {
            body.totalBalance = 0;
        }
        if (!body.confBalance) {
            body.confBalance = 0;
        }
        if (!body.unconfBalance) {
            body.unconfBalance = 0;
        }
        logger.log({ level: 'INFO', fileName: 'Balance', msg: 'Balance Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Balance', 'Get Balance Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

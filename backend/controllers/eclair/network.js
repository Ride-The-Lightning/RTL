import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getNodes = (req, res, next) => {
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

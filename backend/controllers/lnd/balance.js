import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getBlockchainBalance = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Balance', msg: 'Getting Balance..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/balance/blockchain';
    options.qs = req.query;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Balance', msg: 'Request params', data: req.params });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Balance', msg: 'Request Query', data: req.query });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Balance', msg: 'Balance', data: body });
        if (body) {
            if (!body.total_balance) {
                body.total_balance = 0;
            }
            if (!body.confirmed_balance) {
                body.confirmed_balance = 0;
            }
            if (!body.unconfirmed_balance) {
                body.unconfirmed_balance = 0;
            }
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Balance', msg: 'Balance Received' });
            res.status(200).json(body);
        }
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Balance', 'Get Balance Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getBalance = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Balance', msg: 'Getting Balance..' });
    options = common.getOptions(req);
    options.url = req.session.selectedNode.ln_server_url + '/v1/balance/' + (req.params.source).toLowerCase();
    options.qs = req.query;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Balance', msg: '[Request params, Request Query, Balance Received]', data: [req.params, req.query, body] });
        if (body) {
            if (req.params.source === 'blockchain') {
                if (!body.total_balance) {
                    body.total_balance = 0;
                }
                if (!body.confirmed_balance) {
                    body.confirmed_balance = 0;
                }
                if (!body.unconfirmed_balance) {
                    body.unconfirmed_balance = 0;
                }
            }
            if (req.params.source === 'channels') {
                if (!body.balance) {
                    body.balance = 0;
                }
                if (!body.pending_open_balance) {
                    body.pending_open_balance = 0;
                }
            }
            logger.log({ level: 'INFO', fileName: 'Balance', msg: 'Balance Received' });
            res.status(200).json(body);
        }
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Balance', 'Get Balance Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

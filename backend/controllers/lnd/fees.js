import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { getAllForwardingEvents } from './switch.js';
let options = null;
const logger = Logger;
const common = Common;
export const getFees = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Fees', msg: 'Getting Fees..' });
    options = common.getOptions(req);
    options.url = req.session.selectedNode.ln_server_url + '/v1/fees';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Fees', msg: 'Fee Received', data: body });
        const today = new Date(Date.now());
        const start_date = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        const current_time = (Math.round(today.getTime() / 1000));
        const month_start_time = (Math.round(start_date.getTime() / 1000));
        const week_start_time = current_time - 604800;
        const day_start_time = current_time - 86400;
        return getAllForwardingEvents(req, month_start_time, current_time, 0, (history) => {
            logger.log({ level: 'DEBUG', fileName: 'Fees', msg: 'Forwarding History Received', data: history });
            const daily_sum = history.forwarding_events.reduce((acc, curr) => ((curr.timestamp >= day_start_time) ? [(acc[0] + 1), (acc[1] + +curr.fee_msat)] : acc), [0, 0]);
            const weekly_sum = history.forwarding_events.reduce((acc, curr) => ((curr.timestamp >= week_start_time) ? [(acc[0] + 1), (acc[1] + +curr.fee_msat)] : acc), [0, 0]);
            const monthly_sum = history.forwarding_events.reduce((acc, curr) => [(acc[0] + 1), (acc[1] + +curr.fee_msat)], [0, 0]);
            logger.log({ level: 'DEBUG', fileName: 'Fees', msg: 'Daily Sum (Transactions, Fee)', data: daily_sum });
            logger.log({ level: 'DEBUG', fileName: 'Fees', msg: 'Weekly Sum (Transactions, Fee)', data: weekly_sum });
            logger.log({ level: 'DEBUG', fileName: 'Fees', msg: 'Monthly Sum (Transactions, Fee)', data: monthly_sum });
            body.daily_tx_count = daily_sum[0];
            body.weekly_tx_count = weekly_sum[0];
            body.monthly_tx_count = monthly_sum[0];
            body.day_fee_sum = (daily_sum[1] / 1000).toFixed(2);
            body.week_fee_sum = (weekly_sum[1] / 1000).toFixed(2);
            body.month_fee_sum = (monthly_sum[1] / 1000).toFixed(2);
            body.forwarding_events_history = history;
            if (history.error) {
                logger.log({ level: 'ERROR', fileName: 'Fees', msg: 'Fetch Forwarding Events Error', error: history.error });
            }
            logger.log({ level: 'INFO', fileName: 'Fees', msg: 'Fees Received' });
            res.status(200).json(body);
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Fees', 'Get Forwarding Events Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

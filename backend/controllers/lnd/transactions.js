import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getTransactions = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Transactions', msg: 'Getting Transactions..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/transactions';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Transactions', msg: 'Transaction Received', data: body });
        if (body.transactions && body.transactions.length > 0) {
            body.transactions = common.sortDescByKey(body.transactions, 'time_stamp');
        }
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Transactions', msg: 'Transactions Received' });
        res.status(200).json(body.transactions);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Transactions', 'List Transactions Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postTransactions = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Transactions', msg: 'Sending Transaction..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/transactions';
    options.form = {
        amount: req.body.amount,
        addr: req.body.address,
        sat_per_byte: req.body.fees,
        target_conf: req.body.blocks
    };
    if (req.body.sendAll) {
        options.form.send_all = req.body.sendAll;
    }
    options.form = JSON.stringify(options.form);
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Transactions', msg: 'Transaction Post Response', data: body });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Transactions', msg: 'Transaction Sent' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Transactions', 'Send Transaction Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

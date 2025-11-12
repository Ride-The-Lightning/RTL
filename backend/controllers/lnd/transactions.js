import axios from 'axios';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getTransactions = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Transactions', msg: 'Getting Transactions..' });
    const axiosConfig = common.getAxiosConfig(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/transactions';
    axios(options).then((body) => {
        body = body.data;
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Transactions', msg: 'Transactions List Received', data: body });
        res.status(200).json(body.transactions);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Transactions', 'List Transactions Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postTransactions = (req, res, next) => {
    const { amount, address, fees, blocks, sendAll } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Transactions', msg: 'Sending Transaction..' });
    const axiosConfig = common.getAxiosConfig(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/transactions';
    options.form = {
        amount: amount,
        addr: address,
        sat_per_byte: fees,
        target_conf: blocks
    };
    if (sendAll) {
        options.form.send_all = sendAll;
    }
    options.form = JSON.stringify(options.form);
    axios.post(options).then((body) => {
        body = body.data;
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Transactions', msg: 'Transaction Sent', data: body });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Transactions', 'Send Transaction Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

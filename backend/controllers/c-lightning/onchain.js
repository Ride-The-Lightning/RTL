import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getNewAddress = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'Generating New Address..' });
    options = common.getOptions(req);
    options.url = req.session.selectedNode.ln_server_url + '/v1/newaddr?addrType=' + req.query.type;
    request(options).then((body) => {
        logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'New Address Generated' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'OnChain', 'New Address Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const onChainWithdraw = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'Withdrawing from On Chain..' });
    options = common.getOptions(req);
    options.url = req.session.selectedNode.ln_server_url + '/v1/withdraw';
    options.body = req.body;
    logger.log({ level: 'DEBUG', fileName: 'OnChain', msg: 'OnChain Withdraw Options', data: options.body });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'OnChain', msg: 'OnChain Withdraw Response', data: body });
        logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'Withdraw Finished' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'OnChain', 'Withdraw Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getUTXOs = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'List Funds..' });
    options = common.getOptions(req);
    options.url = req.session.selectedNode.ln_server_url + '/v1/listFunds';
    request(options).then((body) => {
        if (body.outputs) {
            body.outputs = common.sortDescByStrKey(body.outputs, 'status');
        }
        logger.log({ level: 'DEBUG', fileName: 'OnChain', msg: 'List Funds Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'OnChain', 'List Funds Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getNewAddress = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'OnChain', msg: 'Generating New Address..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/newaddr';
    options.body = req.body;
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'OnChain', msg: 'New Address Generated', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'OnChain', 'New Address Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const onChainWithdraw = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'OnChain', msg: 'Withdrawing from On Chain..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/withdraw';
    options.body = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'OnChain', msg: 'OnChain Withdraw Options', data: options.body });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'OnChain', msg: 'Withdraw Finished', data: body });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'OnChain', 'Withdraw Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getUTXOs = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'OnChain', msg: 'Listing Funds..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/listfunds';
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'OnChain', msg: 'Funds List Received', data: body });
        // Local Remote Balance Calculation
        let lrBalance = { localBalance: 0, remoteBalance: 0, inactiveBalance: 0, pendingBalance: 0 };
        body.channels.forEach((channel) => {
            if ((channel.state === 'CHANNELD_NORMAL') && channel.connected === true) {
                lrBalance.localBalance = lrBalance.localBalance + channel.our_amount_msat;
                lrBalance.remoteBalance = lrBalance.remoteBalance + (channel.amount_msat - channel.our_amount_msat);
            }
            else if ((channel.state === 'CHANNELD_NORMAL') && channel.connected === false) {
                lrBalance.inactiveBalance = lrBalance.inactiveBalance + channel.our_amount_msat;
            }
            else if (channel.state === 'CHANNELD_AWAITING_LOCKIN' || channel.state === 'DUALOPEND_AWAITING_LOCKIN') {
                lrBalance.pendingBalance = lrBalance.pendingBalance + channel.our_amount_msat;
            }
        });
        lrBalance = {
            localBalance: lrBalance.localBalance / 1000,
            remoteBalance: lrBalance.remoteBalance / 1000,
            inactiveBalance: lrBalance.inactiveBalance / 1000,
            pendingBalance: lrBalance.pendingBalance / 1000
        };
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Onchain', msg: 'Local Remote Balance', data: lrBalance });
        // Onchain Balance Calculation
        let onchainBalance = { totalBalance: 0, confBalance: 0, unconfBalance: 0 };
        body.outputs.forEach((output) => {
            if (output.status === 'confirmed') {
                onchainBalance.confBalance = onchainBalance.confBalance + output.amount_msat;
            }
            else if (output.status === 'unconfirmed') {
                onchainBalance.unconfBalance = onchainBalance.unconfBalance + output.amount_msat;
            }
        });
        onchainBalance = {
            totalBalance: onchainBalance.confBalance / 1000,
            confBalance: (onchainBalance.confBalance - onchainBalance.unconfBalance) / 1000,
            unconfBalance: onchainBalance.unconfBalance / 1000
        };
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Onchain', msg: 'Onchain Balance Received', data: onchainBalance });
        res.status(200).json({ utxos: body.outputs || [], balance: onchainBalance, localRemoteBalance: lrBalance });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'OnChain', 'List Funds Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

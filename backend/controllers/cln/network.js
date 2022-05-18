import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getRoute = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Getting Network Routes..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/network/getRoute/' + req.params.destPubkey + '/' + req.params.amount;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Network Routes Received', data: body });
        res.status(200).json({ routes: body });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Query Routes Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listNode = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Node Lookup..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/network/listNode/' + req.params.id;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Node Lookup Finished', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Node Lookup Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listChannel = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Channel Lookup..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/network/listChannel/' + req.params.channelShortId;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Channel Lookup Finished', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Channel Lookup Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const feeRates = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Getting Network Fee Rates..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/network/feeRates/' + req.params.feeRateStyle;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Network Fee Rates Received for ' + req.params.feeRateStyle, data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Fee Rates Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listNodes = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'List Nodes..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/network/listNodes' + (req.query !== {} ? (JSON.stringify(req.query).replace('{', '?').replace('}', '').replace(/:/g, '=').replace(/,/g, '&').replace(/"/g, '')) : '');
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'List Nodes Finished', data: body });
        body.forEach((node, i) => {
            node.option_will_fund.lease_fee_base_msat = (node.option_will_fund && node.option_will_fund.lease_fee_base_msat && typeof node.option_will_fund.lease_fee_base_msat === 'string' && node.option_will_fund.lease_fee_base_msat.includes('msat')) ? node.option_will_fund.lease_fee_base_msat.replace('msat', '') : node.option_will_fund.lease_fee_base_msat;
            node.option_will_fund.channel_fee_max_base_msat = (node.option_will_fund && node.option_will_fund.channel_fee_max_base_msat && typeof node.option_will_fund.channel_fee_max_base_msat === 'string' && node.option_will_fund.channel_fee_max_base_msat.includes('msat')) ? node.option_will_fund.channel_fee_max_base_msat.replace('msat', '') : node.option_will_fund.channel_fee_max_base_msat;
            // TO BE REMOVED
            node.channelCount = +(Math.random() * 10).toFixed(0);
            node.nodeCapacity = +(Math.random() * 1000000).toFixed(0);
            // TO BE REMOVED
            return node;
        });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Node Lookup Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

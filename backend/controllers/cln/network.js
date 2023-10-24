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
    options.url = req.session.selectedNode.ln_server_url + '/v1/getroute';
    options.form = { id: req.params.destPubkey, amount_msat: req.params.amount, riskfactor: (req.query.riskFactor || 0) };
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Network Routes Received', data: body });
        res.status(200).json({ routes: body });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Query Routes Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listChannels = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Channel Lookup..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/listchannels';
    options.form = req.params.channelShortId ? { short_channel_id: req.params.channelShortId } : null;
    request.post(options).then((body) => {
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
    options.url = req.session.selectedNode.ln_server_url + '/v1/feerates';
    options.form = req.params.feeRateStyle ? { style: req.params.feeRateStyle } : null;
    request.post(options).then((body) => {
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
    const queryStr = req.query.liquidity_ads ? '?liquidity_ads=' + req.query.liquidity_ads : '';
    options.url = req.session.selectedNode.ln_server_url + '/v1/listnodes';
    options.form = req.params.id ? { id: req.params.id } : null;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Network', msg: 'List Nodes URL' + options.url });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'List Nodes Finished', data: body });
        let response = body.nodes;
        if (req.query.liquidity_ads && typeof req.query.liquidity_ads === 'string' && req.query.liquidity_ads.toLowerCase() === 'yes') {
            response = body.nodes.filter((node) => {
                if (node.option_will_fund) {
                    node.option_will_fund.lease_fee_base_msat = (node.option_will_fund.lease_fee_base_msat && typeof node.option_will_fund.lease_fee_base_msat === 'string' &&
                        node.option_will_fund.lease_fee_base_msat.includes('msat')) ? node.option_will_fund.lease_fee_base_msat?.replace('msat', '') : node.option_will_fund.lease_fee_base_msat;
                    node.option_will_fund.channel_fee_max_base_msat = (node.option_will_fund.channel_fee_max_base_msat && typeof node.option_will_fund.channel_fee_max_base_msat === 'string' &&
                        node.option_will_fund.channel_fee_max_base_msat.includes('msat')) ? node.option_will_fund.channel_fee_max_base_msat?.replace('msat', '') : node.option_will_fund.channel_fee_max_base_msat;
                }
                return node;
            });
        }
        res.status(200).json(response);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Node Lookup Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

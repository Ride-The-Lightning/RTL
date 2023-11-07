import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { getAlias } from './network.js';
let options = null;
const logger = Logger;
const common = Common;
export const listPeerChannels = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Peer Channels..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/listpeerchannels';
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Peer Channels List Received', data: body.channels });
        return Promise.all(body.channels?.map((channel) => {
            const local = (channel.to_us_msat && typeof channel.to_us_msat === 'string' && channel.to_us_msat.includes('msat')) ? +channel.to_us_msat.replace('msat', '') : channel.to_us_msat ? channel.to_us_msat : 0;
            const total = (channel.total_msat && typeof channel.total_msat === 'string' && channel.total_msat.includes('msat')) ? +channel.total_msat.replace('msat', '') : channel.total_msat ? channel.total_msat : 0;
            const remote = total - local;
            channel.to_them_msat = remote;
            channel.balancedness = (total === 0) ? 1 : (1 - Math.abs((local - remote) / total)).toFixed(3);
            return getAlias(req.session.selectedNode, channel, 'peer_id');
        })).then((values) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Peer Channels List With Aliases Received', data: body.channels });
            return res.status(200).json(body.channels || []);
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'List Peer Channels Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const openChannel = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/fundchannel';
    options.body = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Options', data: options.body });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Opened', data: body });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Open Channel Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const setChannelFee = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Setting Channel Fee..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/setchannel';
    options.body = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy Options', data: options.body });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Updated Channel Policy', data: body });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Update Channel Policy Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const closeChannel = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..' });
    req.setTimeout(60000 * 10); // timeout 10 mins
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/close';
    options.body = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel', data: options.url });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Closed', data: body });
        res.status(204).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Close Channel Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listForwards = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channel List Forwards..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/listforwards';
    options.body = req.body;
    request.get(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Forwarding History Received For Status ' + req.query.status, data: body });
        res.status(200).json(!body.forwards ? [] : (req.query.status === 'failed' || req.query.status === 'local_failed') ? body.forwards.slice(Math.max(0, body.forwards.length - 1000), Math.max(1000, body.forwards.length)).reverse() : body.forwards.reverse());
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Forwarding History Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const funderUpdatePolicy = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting or Updating Funder Policy..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/funderupdate';
    options.body = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Funder Update Body', data: options.body });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Funder Policy Received', data: body });
        body.channel_fee_max_base_msat = (body.channel_fee_max_base_msat && typeof body.channel_fee_max_base_msat === 'string' && body.channel_fee_max_base_msat.includes('msat')) ? +body.channel_fee_max_base_msat?.replace('msat', '') : body.channel_fee_max_base_msat ? body.channel_fee_max_base_msat : 0;
        body.lease_fee_base_msat = (body.lease_fee_base_msat && typeof body.lease_fee_base_msat === 'string' && body.lease_fee_base_msat.includes('msat')) ? +body.lease_fee_base_msat?.replace('msat', '') : body.channel_fee_max_base_msat ? body.channel_fee_max_base_msat : 0;
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Funder Policy Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

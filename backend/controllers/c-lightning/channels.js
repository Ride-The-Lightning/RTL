import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const listChannels = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Getting Channels..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/channel/listChannels';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'List Channels', data: body });
        body.map((channel) => {
            if (!channel.alias || channel.alias === '') {
                channel.alias = channel.id.substring(0, 20);
            }
            const local = (channel.msatoshi_to_us) ? channel.msatoshi_to_us : 0;
            const remote = (channel.msatoshi_to_them) ? channel.msatoshi_to_them : 0;
            const total = channel.msatoshi_total ? channel.msatoshi_total : 0;
            channel.balancedness = (total === 0) ? 1 : (1 - Math.abs((local - remote) / total)).toFixed(3);
            return channel;
        });
        logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Channels Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'List Channels Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const openChannel = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/channel/openChannel';
    options.body = req.body;
    logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Options', data: options.body });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Response', data: body });
        logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Channel Opened' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Open Channel Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const setChannelFee = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Setting Channel Fee..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/channel/setChannelFee';
    options.body = req.body;
    logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy Options', data: options.body });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy', data: body });
        logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Channel Fee Set' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Update Channel Policy Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const closeChannel = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..' });
    req.setTimeout(60000 * 10); // timeout 10 mins
    options = common.getOptions();
    const unilateralTimeoutQuery = req.query.force ? '?unilateralTimeout=1' : '';
    options.url = common.getSelLNServerUrl() + '/v1/channel/closeChannel/' + req.params.channelId + unilateralTimeoutQuery;
    logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel', data: options.url });
    request.delete(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Close Channel Response', data: body });
        logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Channel Closed' });
        res.status(204).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Close Channel Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getLocalRemoteBalance = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Getting Local & Remote Balances..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/channel/localremotebal';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Local Remote Balance', data: body });
        if (!body.localBalance) {
            body.localBalance = 0;
        }
        if (!body.remoteBalance) {
            body.remoteBalance = 0;
        }
        logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Local & Remote Balances Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Local Remote Balance Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listForwards = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Getting Channel List Forwards..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/channel/listForwards?status=' + req.query.status;
    request.get(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Forwarding History Response For Status ' + req.query.status, data: body });
        if (body && body.length > 0) {
            body = common.sortDescByKey(body, 'received_time');
        }
        logger.log({ level: 'DEBUG', fileName: 'Channels', msg: 'Forwarding History Received For Status' + req.query.status, data: body });
        logger.log({ level: 'INFO', fileName: 'Channels', msg: 'Channel List Forwards Received For Status ' + req.query.status });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Forwarding History Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

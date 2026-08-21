import request from '../../utils/request.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getAliasForChannel = (selNode, channel, requestOptions) => {
    const pubkey = (channel.remote_pubkey) ? channel.remote_pubkey : (channel.remote_node_pub) ? channel.remote_node_pub : '';
    requestOptions.url = selNode.settings.lnServerUrl + '/v1/graph/node/' + pubkey;
    return request(requestOptions).then((aliasBody) => {
        logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Channels', msg: 'Alias Received', data: aliasBody.node.alias });
        channel.remote_alias = aliasBody.node.alias && aliasBody.node.alias !== '' ? aliasBody.node.alias : aliasBody.node.pub_key.slice(0, 20);
        return channel;
    }).catch((err) => {
        channel.remote_alias = pubkey.slice(0, 20);
        return channel;
    });
};
export const getAllChannels = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channels..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/channels';
    options.qs = req.query;
    let local = 0;
    let remote = 0;
    let total = 0;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Channels List Received', data: body });
        if (body.channels) {
            body.channels.forEach((channel) => {
                local = (channel.local_balance) ? +channel.local_balance : 0;
                remote = (channel.remote_balance) ? +channel.remote_balance : 0;
                total = local + remote;
                channel.balancedness = (total === 0) ? 1 : (1 - Math.abs((local - remote) / total)).toFixed(3);
            });
            const selNode = req.session.selectedNode;
            const { qs: _qs, ...requestOptions } = options;
            const getChannelAliasesTasks = body.channels.map((channel) => () => getAliasForChannel(selNode, channel, { ...requestOptions }));
            common.runWithConcurrencyLimit(getChannelAliasesTasks, 20, () => {
                try {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Sorted Channels List Received', data: body });
                    return res.status(200).json(body);
                }
                catch (e) {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Get All Channel Aliases Error', error: e.message });
                    if (!res.headersSent) {
                        res.status(500).json({ message: 'Get All Channel Aliases Error', error: e.message });
                    }
                }
            });
        }
        else {
            body.channels = [];
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Empty Channels List Received' });
            return res.status(200).json(body);
        }
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'List Channels Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getPendingChannels = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Pending Channels..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/channels/pending';
    options.qs = req.query;
    request(options).then((body) => {
        if (!body.total_limbo_balance) {
            body.total_limbo_balance = 0;
        }
        const selNode = req.session.selectedNode;
        const { qs: _qs, ...requestOptions } = options;
        const getPendingAliasesTasks = [];
        if (body.pending_open_channels && body.pending_open_channels.length > 0) {
            body.pending_open_channels?.map((channel) => getPendingAliasesTasks.push(() => getAliasForChannel(selNode, channel.channel, { ...requestOptions })));
        }
        if (body.pending_force_closing_channels && body.pending_force_closing_channels.length > 0) {
            body.pending_force_closing_channels?.map((channel) => getPendingAliasesTasks.push(() => getAliasForChannel(selNode, channel.channel, { ...requestOptions })));
        }
        if (body.pending_closing_channels && body.pending_closing_channels.length > 0) {
            body.pending_closing_channels?.map((channel) => getPendingAliasesTasks.push(() => getAliasForChannel(selNode, channel.channel, { ...requestOptions })));
        }
        if (body.waiting_close_channels && body.waiting_close_channels.length > 0) {
            body.waiting_close_channels?.map((channel) => getPendingAliasesTasks.push(() => getAliasForChannel(selNode, channel.channel, { ...requestOptions })));
        }
        common.runWithConcurrencyLimit(getPendingAliasesTasks, 20, () => {
            try {
                logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Pending Channels List Received', data: body });
                return res.status(200).json(body);
            }
            catch (e) {
                logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Get Pending Channel Aliases Error', error: e.message });
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Get Pending Channel Aliases Error', error: e.message });
                }
            }
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'List Pending Channels Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getClosedChannels = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Closed Channels..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/channels/closed';
    options.qs = req.query;
    request(options).then((body) => {
        if (body.channels && body.channels.length > 0) {
            body.channels.forEach((channel) => {
                channel.close_type = (!channel.close_type) ? 'COOPERATIVE_CLOSE' : channel.close_type;
            });
            const selNode = req.session.selectedNode;
            const { qs: _qs, ...requestOptions } = options;
            const getClosedAliasesTasks = body.channels.map((channel) => () => getAliasForChannel(selNode, channel, { ...requestOptions }));
            common.runWithConcurrencyLimit(getClosedAliasesTasks, 20, () => {
                try {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closed Channels List Received', data: body });
                    return res.status(200).json(body);
                }
                catch (e) {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Get Closed Channel Aliases Error', error: e.message });
                    if (!res.headersSent) {
                        res.status(500).json({ message: 'Get Closed Channel Aliases Error', error: e.message });
                    }
                }
            });
        }
        else {
            body.channels = [];
            return res.status(200).json(body);
        }
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'List Closed Channels Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
// A urlencoded body cannot carry a boolean, so the flag arrives spelled however the client
// writes it — 'true' from RTL's own form, 'on' from a bare HTML checkbox, '1' or 'True' from a
// script — and a field repeated in the body reaches Express as an array. Every one of those is
// truthy as a string, so the value is matched rather than tested, and anything outside both
// lists returns null for the caller to reject: guessing either way misstates the amount by the
// whole on-chain wallet.
const FUND_MAX_TRUE = ['true', 'on', 'yes', '1'];
const FUND_MAX_FALSE = ['false', 'off', 'no', '0', ''];
const parseFundMax = (value) => {
    if (value === undefined || value === null) {
        return false;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'number') {
        return value === 1 ? true : value === 0 ? false : null;
    }
    if (typeof value !== 'string') {
        return null;
    }
    const spelling = value.trim().toLowerCase();
    return FUND_MAX_TRUE.includes(spelling) ? true : FUND_MAX_FALSE.includes(spelling) ? false : null;
};
// An amount field left untouched by a form posts as an empty string, and a zero is not an
// amount any channel can be opened for, so neither contradicts a request to fund the maximum.
const hasFundingAmount = (amount) => amount !== undefined && amount !== null && amount !== '' && +amount !== 0;
export const postChannel = (req, res, next) => {
    const { node_pubkey, private: privateChannel, spend_unconfirmed, local_funding_amount, fund_max, trans_type, trans_type_value, commitment_type } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/channels';
    options.form = {
        node_pubkey_string: node_pubkey,
        private: privateChannel,
        spend_unconfirmed: spend_unconfirmed
    };
    // LND rejects a request carrying both, and computes the maximum itself: the wallet
    // balance less the on-chain fee and the reserve it keeps back for anchor channels.
    const fundMaxRequested = parseFundMax(fund_max);
    if (fundMaxRequested === null) {
        // Neither a true nor a false spelling. Reading it as false would open a channel for an
        // amount the caller did not mean, and reading it as true would commit the whole wallet.
        logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Open Channel Error', error: 'Unrecognized fund_max value' });
        return res.status(400).json({ message: 'Open Channel Error', error: 'fund_max must be true or false.' });
    }
    if (fundMaxRequested && hasFundingAmount(local_funding_amount)) {
        // Contradictory, and the two readings differ by the whole wallet, so fail closed rather
        // than pick one and drop the amount the caller asked for without saying so.
        logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Open Channel Error', error: 'Both fund_max and local_funding_amount received' });
        return res.status(400).json({ message: 'Open Channel Error', error: 'Send either fund_max or local_funding_amount, not both.' });
    }
    if (fundMaxRequested) {
        options.form.fund_max = true;
    }
    else {
        options.form.local_funding_amount = local_funding_amount;
    }
    if (trans_type === '1') {
        options.form.target_conf = trans_type_value;
    }
    else if (trans_type === '2') {
        options.form.sat_per_vbyte = trans_type_value;
    }
    if (commitment_type) {
        options.form.commitment_type = commitment_type;
    }
    options.form = JSON.stringify(options.form);
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Channel Open Options', data: options.form });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Opened', data: body });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Open Channel Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const closeChannel = (req, res, next) => {
    try {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..' });
        if (!req.session.selectedNode) {
            const err = common.handleError({ message: 'Session Expired after a day\'s inactivity.', statusCode: 401 }, 'Session Expired', 'Session Expiry Error', null);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
        options = common.getOptions(req);
        if (options.error) {
            return res.status(options.statusCode).json({ message: options.message, error: options.error });
        }
        const channelpoint = req.params.channelPoint?.replace(':', '/');
        options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/channels/' + channelpoint + '?force=' + req.query.force;
        if (req.query.target_conf) {
            options.url = options.url + '&target_conf=' + req.query.target_conf;
        }
        if (req.query.sat_per_vbyte) {
            options.url = options.url + '&sat_per_vbyte=' + req.query.sat_per_vbyte;
        }
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel Options URL', data: options.url });
        // Fire-and-forget: LND keeps the close stream open until the closing tx
        // confirms, so exempt it from the request timeout; the 202 is already sent,
        // so log a rejection instead of letting it crash the process.
        request.delete({ ...options, timeout: 0 }).catch((errRes) => {
            const err = common.handleError(errRes, 'Channels', 'Close Channel Error', req.session.selectedNode);
            logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Close Channel Error', error: err });
        });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Close Requested' });
        res.status(202).json({ message: 'Close channel request has been submitted.' });
    }
    catch (error) {
        logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Close Channel Error', error: error.message });
        return res.status(500).json({ message: 'Close Channel Error', error: error.message });
    }
};
export const postChanPolicy = (req, res, next) => {
    const { chanPoint, baseFeeMsat, feeRate, timeLockDelta, max_htlc_msat, min_htlc_msat } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Updating Channel Policy..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/chanpolicy';
    if (chanPoint === 'all') {
        options.form = JSON.stringify({
            global: true,
            base_fee_msat: baseFeeMsat,
            fee_rate: parseFloat((feeRate / 1000000).toString()),
            time_lock_delta: parseInt(timeLockDelta)
        });
    }
    else {
        const breakPoint = chanPoint.indexOf(':');
        const txid_str = chanPoint.substring(0, breakPoint);
        const output_idx = chanPoint.substring(breakPoint + 1, chanPoint.length);
        const optionsBody = {
            base_fee_msat: baseFeeMsat,
            fee_rate: parseFloat((feeRate / 1000000).toString()),
            time_lock_delta: parseInt(timeLockDelta),
            chan_point: { funding_txid_str: txid_str, output_index: parseInt(output_idx) }
        };
        if (max_htlc_msat) {
            optionsBody['max_htlc_msat'] = max_htlc_msat;
        }
        if (min_htlc_msat) {
            optionsBody['min_htlc_msat'] = min_htlc_msat;
            optionsBody['min_htlc_msat_specified'] = true;
        }
        options.form = JSON.stringify(optionsBody);
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy Options', data: options.form });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Policy Updated', data: body });
        if (body.failed_updates && body.failed_updates.length && body.failed_updates[0].update_error) {
            const err = common.handleError({ error: body.failed_updates[0].update_error }, 'Channels', 'Update Channel Policy Error', req.session.selectedNode);
            return res.status(500).json({ message: err.message, error: err.error });
        }
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Update Channel Policy Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

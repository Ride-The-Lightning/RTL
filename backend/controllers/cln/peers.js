import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { getAlias } from './network.js';
let options = null;
const logger = Logger;
const common = Common;
export const getPeers = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'List Peers..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/listpeers';
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peers List Received', data: body });
        const peers = !body.peers ? [] : body.peers;
        return Promise.all(peers?.map((peer) => {
            peer.channels.forEach((channel) => {
                channel.to_us_msat = common.removeMSat(channel.to_us_msat);
                channel.total_msat = common.removeMSat(channel.total_msat);
                channel.last_tx_fee_msat = common.removeMSat(channel.last_tx_fee_msat);
                channel.funding.local_funds_msat = common.removeMSat(channel.funding.local_funds_msat);
                channel.funding.remote_funds_msat = common.removeMSat(channel.funding.remote_funds_msat);
                channel.funding.pushed_msat = common.removeMSat(channel.funding.pushed_msat);
                channel.min_to_us_msat = common.removeMSat(channel.min_to_us_msat);
                channel.max_to_us_msat = common.removeMSat(channel.max);
                channel.fee_base_msat = common.removeMSat(channel.fee_base_msat);
                channel.dust_limit_msat = common.removeMSat(channel.dust_limit_msat);
                channel.max_total_htlc_in_msat = common.removeMSat(channel.max_total_htlc_in_msat);
                channel.their_reserve_msat = common.removeMSat(channel.their_reserve_msat);
                channel.our_reserve_msat = common.removeMSat(channel.our_reserve_msat);
                channel.spendable_msat = common.removeMSat(channel.spendable_msat);
                channel.receivable_msat = common.removeMSat(channel.receivable_msat);
                channel.minimum_htlc_in_msat = common.removeMSat(channel.minimum_htlc_in_msat);
                channel.minimum_htlc_out_msat = common.removeMSat(channel.minimum_htlc_out_msat);
                channel.maximum_htlc_out_msat = common.removeMSat(channel.maximum_htlc_out_msat);
                channel.in_offered_msat = common.removeMSat(channel.in_offered_msat);
                channel.in_fulfilled_msat = common.removeMSat(channel.in_fulfilled_msat);
                channel.out_offered_msat = common.removeMSat(channel.out_offered_msat);
                channel.out_fulfilled_msat = common.removeMSat(channel.out_fulfilled_msat);
            });
            return getAlias(req.session.selectedNode, peer, 'id');
        })).then((values) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Sorted Peers List Received', data: body.peers });
            res.status(200).json(body.peers || []);
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'List Peers Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postPeer = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Connecting Peer..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/connect';
    options.body = req.body;
    request.post(options).then((connectRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer Connected', data: connectRes });
        const listOptions = common.getOptions(req);
        listOptions.url = req.session.selectedNode.ln_server_url + '/v1/listpeers';
        request.post(listOptions).then((listPeersRes) => {
            const peers = listPeersRes && listPeersRes.peers ? common.newestOnTop(listPeersRes.peers, 'id', connectRes.id) : [];
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peers List after Connect Received', data: peers });
            res.status(201).json(peers);
        }).catch((errRes) => {
            const err = common.handleError(errRes, 'Peers', 'Connect Peer Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'Connect Peer Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const deletePeer = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Disconnecting Peer..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/disconnect';
    options.body = req.body;
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnected', data: body });
        res.status(204).json({});
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'Detach Peer Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

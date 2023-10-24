import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
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
        body.peers.forEach((peer) => {
            peer.alias = peer.peer_id.substring(0, 20);
            return peer;
        });
        // Promise.all(body.peers.map((peer) => getAliasForPeer(peer))).then((peerList) => {
        //   logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peers with Alias Received', data: body });
        //   res.status(200).json(peerList || []);
        // }).catch((errRes) => {
        //   const err = common.handleError(errRes, 'Peers', 'List Peers Alias Error', req.session.selectedNode);
        //   return res.status(err.statusCode).json({ message: err.message, error: err.error });
        // });
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
    options.form = req.body;
    request.post(options).then((connectRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer Connected', data: connectRes });
        options.url = req.session.selectedNode.ln_server_url + '/v1/listpeers';
        request.post(options).then((listPeersRes) => {
            const peers = listPeersRes ? common.newestOnTop(listPeersRes, 'id', req.body.id) : [];
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
    options.form = { id: req.params.peerId, force: !!req.query.force };
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnected', data: body });
        res.status(204).json({});
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'Detach Peer Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

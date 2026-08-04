import request from '../../utils/request.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getAliasForPeers = (selNode, peer, requestOptions) => {
    requestOptions.url = selNode.settings.lnServerUrl + '/v1/graph/node/' + peer.pub_key;
    return request(requestOptions).then((aliasBody) => {
        logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Peers', msg: 'Alias Received', data: aliasBody.node.alias });
        peer.alias = aliasBody.node.alias;
        return aliasBody.node.alias;
    }).catch((err) => {
        peer.alias = peer.pub_key.slice(0, 20);
        return peer.pub_key;
    });
};
export const getPeers = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Getting Peers..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/peers';
    const selNode = req.session.selectedNode;
    const { qs: _qs, ...requestOptions } = options;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peers List Received', data: body });
        const peers = !body.peers ? [] : body.peers;
        // Bound concurrent alias lookups so a node with many peers can't fire one graph/node
        // request per peer at once and overwhelm the backend (parity with the CLN fix, #1501).
        const getPeerAliasesTasks = peers.map((peer) => () => getAliasForPeers(selNode, peer, { ...requestOptions }));
        common.runWithConcurrencyLimit(getPeerAliasesTasks, 20, () => {
            // Guard the response-send: the limiter invokes this outside the surrounding .catch.
            try {
                logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Sorted Peers List Received', data: body.peers });
                res.status(200).json(body.peers);
            }
            catch (e) {
                const err = common.handleError(e, 'Peers', 'List Peers Error', req.session.selectedNode);
                if (!res.headersSent) {
                    res.status(err.statusCode).json({ message: err.message, error: err.error });
                }
            }
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'List Peers Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postPeer = (req, res, next) => {
    const { host, pubkey, perm } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Connecting Peer..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/peers';
    options.form = JSON.stringify({
        addr: { host: host, pubkey: pubkey },
        perm: perm
    });
    const selNode = req.session.selectedNode;
    const { qs: _qs, ...requestOptions } = options;
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer Connected', data: body });
        options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/peers';
        request(options).then((body) => {
            const peers = (!body.peers) ? [] : body.peers;
            // Bound concurrent alias lookups (parity with the CLN fix, #1501).
            const getPeerAliasesTasks = peers.map((peer) => () => getAliasForPeers(selNode, peer, { ...requestOptions }));
            common.runWithConcurrencyLimit(getPeerAliasesTasks, 20, () => {
                // Guard the response-send: the limiter invokes this outside the surrounding .catch, and
                // this replaced an explicit inner .catch — a throw here must not hang the POST (#1629 F4).
                try {
                    if (body.peers) {
                        body.peers = common.newestOnTop(body.peers, 'pub_key', pubkey);
                        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peers List after Connect Received', data: body });
                    }
                    res.status(201).json(body.peers);
                }
                catch (e) {
                    const err = common.handleError(e, 'Peers', 'Connect Peer Error', req.session.selectedNode);
                    if (!res.headersSent) {
                        res.status(err.statusCode).json({ message: err.message, error: err.error });
                    }
                }
            });
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
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/peers/' + req.params.peerPubKey;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnect Pubkey', data: req.params.peerPubKey });
    request.delete(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Disconneted', data: body });
        res.status(204).json({});
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'Disconnect Peer Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

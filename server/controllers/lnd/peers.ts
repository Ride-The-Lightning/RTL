import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { CommonSelectedNode } from '../../models/config.model.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getAliasForPeers = (selNode: CommonSelectedNode, peer) => {
  options.url = selNode.ln_server_url + '/v1/graph/node/' + peer.pub_key;
  return request(options).then((aliasBody) => {
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Peers', msg: 'Alias Received', data: aliasBody.node.alias });
    peer.alias = aliasBody.node.alias;
    return aliasBody.node.alias;
  }).catch((err) => {
    peer.alias = peer.pub_key.slice(0, 10) + '...' + peer.pub_key.slice(-10);
    return peer.pub_key;
  });
};

export const getPeers = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Getting Peers..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/peers';
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peers List Received', data: body });
    const peers = !body.peers ? [] : body.peers;
    return Promise.all(peers.map((peer) => getAliasForPeers(req.session.selectedNode, peer))).then((values) => {
      logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias before Sort', data: body });
      if (body.peers) {
        body.peers = common.sortDescByStrKey(body.peers, 'alias');
      }
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Sorted Peers List Received', data: body.peers });
      res.status(200).json(body.peers);
    });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Peers', 'List Peers Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const postPeer = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Connecting Peer..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/peers';
  options.form = JSON.stringify({
    addr: { host: req.body.host, pubkey: req.body.pubkey },
    perm: req.body.perm
  });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer Connected', data: body });
    options.url = req.session.selectedNode.ln_server_url + '/v1/peers';
    request(options).then((body) => {
      const peers = (!body.peers) ? [] : body.peers;
      return Promise.all(peers.map((peer) => getAliasForPeers(req.session.selectedNode, peer))).then((values) => {
        if (body.peers) {
          body.peers = common.sortDescByStrKey(body.peers, 'alias');
          body.peers = common.newestOnTop(body.peers, 'pub_key', req.body.pubkey);
          logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peers List after Connect Received', data: body });
        }
        res.status(201).json(body.peers);
      }).catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'Connect Peer Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
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
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/peers/' + req.params.peerPubKey;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnect Pubkey', data: req.params.peerPubKey });
  request.delete(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Disconneted', data: body });
    res.status(204).json({});
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Peers', 'Disconnect Peer Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

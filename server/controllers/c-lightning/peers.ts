import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getPeers = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'List Peers..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/peer/listPeers';
  request(options).then((body) => {
    body.forEach((peer) => {
      if (!peer.alias || peer.alias === '') {
        peer.alias = peer.id.substring(0, 20);
      }
    });
    const peers = (body) ? common.sortDescByStrKey(body, 'alias') : [];
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias', data: peers });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peers Received' });
    res.status(200).json(peers);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Peers', 'List Peers Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const postPeer = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Connecting Peer..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/peer/connect';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added', data: body });
    options.url = req.session.selectedNode.ln_server_url + '/v1/peer/listPeers';
    request(options).then((body) => {
      let peers = (body) ? common.sortDescByStrKey(body, 'alias') : [];
      peers = common.newestOnTop(peers, 'id', req.body.id);
      logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer with Newest On Top', data: peers });
      logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added Successfully' });
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Connected' });
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
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/peer/disconnect/' + req.params.peerId + '?force=' + req.query.force;
  request.delete(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Detach Peer Response', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peer Detached', data: req.params.peerId });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnected' });
    res.status(204).json({});
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Peers', 'Detach Peer Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

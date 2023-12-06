import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { getAlias } from './network.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getPeers = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'List Peers..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listpeers';
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Peers', msg: 'Peers List Received', data: body });
    const peers = !body.peers ? [] : body.peers;
    return Promise.all(peers?.map((peer) => getAlias(req.session.selectedNode, peer, 'id'))).then((values) => {
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
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
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
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
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

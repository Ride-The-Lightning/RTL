import * as request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger';
import { Common, CommonService } from '../../utils/common';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getFilteredNodes = (peersNodeIds) => {
  options.url = common.getSelLNServerUrl() + '/nodes';
  options.form = { nodeIds: peersNodeIds };
  return request.post(options).then((nodes) => {
    logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Filtered Nodes', data: nodes });
    return nodes;
  }).catch((err) => []);
};

export const getPeers = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'Peers', msg: 'Getting Peers..' });
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peers';
  options.form = {};
  if (common.read_dummy_data) {
    common.getDummyData('Peers').then((data) => { res.status(200).json(data); });
  } else {
    request.post(options).then((body) => {
      logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Peers Received', data: body });
      if (body && body.length) {
        let peersNodeIds = '';
        body.forEach((peer) => { peersNodeIds = peersNodeIds + ',' + peer.nodeId; });
        peersNodeIds = peersNodeIds.substring(1);
        return getFilteredNodes(peersNodeIds).then((peersWithAlias) => {
          let foundPeer = null;
          body.map((peer) => {
            foundPeer = peersWithAlias.find((peerWithAlias) => peer.nodeId === peerWithAlias.nodeId);
            peer.alias = foundPeer ? foundPeer.alias : peer.nodeId.substring(0, 20);
            return peer;
          });
          body = common.sortDescByStrKey(body, 'alias');
          logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias', data: body });
          logger.log({ level: 'INFO', fileName: 'Peers', msg: 'Peers Received' });
          res.status(200).json(body);
        });
      } else {
        logger.log({ level: 'INFO', fileName: 'Peers', msg: 'Empty Peers Received' });
        res.status(200).json([]);
      }
    }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'Peers', 'List Peers Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  }
};

export const connectPeer = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'Peers', msg: 'Conneting Peer..' });
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/connect';
  options.form = {};
  if (req.query) {
    options.form = req.query;
    logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Connect Peer Params', data: options.form });
  }
  request.post(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Add Peer Response', data: body });
    if (typeof body === 'string' && body.includes('already connected')) {
      const err = common.handleError({ statusCode: 500, message: 'Connect Peer Error', error: body }, 'Peers', body);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    } else if (typeof body === 'string' && body.includes('connection failed')) {
      const err = common.handleError({ statusCode: 500, message: 'Connect Peer Error', error: body }, 'Peers', body);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = common.getSelLNServerUrl() + '/peers';
    options.form = {};
    request.post(options).then((body) => {
      logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Peers Received', data: body });
      if (body && body.length) {
        let peersNodeIds = '';
        body.forEach((peer) => { peersNodeIds = peersNodeIds + ',' + peer.nodeId; });
        peersNodeIds = peersNodeIds.substring(1);
        return getFilteredNodes(peersNodeIds).then((peersWithAlias) => {
          let foundPeer = null;
          body.map((peer) => {
            foundPeer = peersWithAlias.find((peerWithAlias) => peer.nodeId === peerWithAlias.nodeId);
            peer.alias = foundPeer ? foundPeer.alias : peer.nodeId.substring(0, 20);
            return peer;
          });
          let peers = (body) ? common.sortDescByStrKey(body, 'alias') : [];
          peers = common.newestOnTop(peers, 'nodeId', req.query.nodeId ? req.query.nodeId : req.query.uri ? req.query.uri.substring(0, req.query.uri.indexOf('@')) : '');
          logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Peer with Newest On Top', data: peers });
          logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added Successfully' });
          logger.log({ level: 'INFO', fileName: 'Peers', msg: 'Peer Connected' });
          res.status(201).json(peers);
        });
      } else {
        res.status(201).json([]);
      }
    }).catch((errRes) => {
      const err = common.handleError(errRes, 'Peers', 'Connect Peer Error');
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Peers', 'Connect Peer Error');
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const deletePeer = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'Peers', msg: 'Disconneting Peer..' });
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/disconnect';
  options.form = {};
  if (req.params.nodeId) {
    options.form = { nodeId: req.params.nodeId };
    logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Disconnect Peer Params', data: options.form });
  }
  request.post(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Disconnect Peer Response', data: body });
    logger.log({ level: 'DEBUG', fileName: 'Peers', msg: 'Peer Disconnected: ' + req.params.nodeId });
    logger.log({ level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnected' });
    res.status(204).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Peers', 'Disconnect Peer Error');
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

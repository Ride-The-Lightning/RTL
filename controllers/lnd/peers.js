var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

getAliasForPeers = (peer) => {
  options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + peer.pub_key;
  return request(options).then(function(aliasBody) {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Alias', data: aliasBody.node.alias});
    peer.alias = aliasBody.node.alias;
    return aliasBody.node.alias;
  })
  .catch(err => {
    peer.alias = peer.pub_key.slice(0, 10) + '...' + peer.pub_key.slice(-10);
    return peer.pub_key;
  });
}

exports.getPeers = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Getting Peers..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peers Received', data: body});
    let peers = !body.peers ? [] : body.peers;
    return Promise.all(peers.map(peer => getAliasForPeers(peer))).then(function(values) {
      logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias before Sort', data: body});
      if (body.peers) {
        body.peers = common.sortDescByStrKey(body.peers, 'alias');
      }
      logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias after Sort', data: body});
      logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peers Received'});
      res.status(200).json(body.peers);
    })
  }).catch(errRes => {
    const err = common.handleError(errRes,  'Peers', 'List Peers Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

exports.postPeer = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Connecting Peer..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers';
  options.form = JSON.stringify({ 
    // addr: { host: req.body.host, pubkey: req.body.pubkey },
    perm: req.body.perm
  });
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added', data: body});
    options.url = common.getSelLNServerUrl() + '/v1/peers';
    request(options).then((body) => {
      let peers = (!body.peers) ? [] : body.peers;
      return Promise.all(peers.map(peer => getAliasForPeers(peer))).then(function(values) {
        if (body.peers) {
          body.peers = common.sortDescByStrKey(body.peers, 'alias');
          logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer with Alias', data: body});
          body.peers = common.newestOnTop(body.peers, 'pub_key', req.body.pubkey);
          logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer with Newest On Top', data: body});
        }
        logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added Successfully'});
        logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peer Connected'});
        res.status(201).json(body.peers);
      }).catch(errRes => {
        const err = common.handleError(errRes,  'Peers', 'Connect Peer Error');
        return res.status(err.statusCode).json({message: err.message, error: err.error});
      });
    }).catch(errRes => {
      const err = common.handleError(errRes,  'Peers', 'Connect Peer Error');
      return res.status(err.statusCode).json({message: err.message, error: err.error});
    });
  }).catch(errRes => {
    const err = common.handleError(errRes,  'Peers', 'Connect Peer Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

exports.deletePeer = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Disconnecting Peer..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers/' + req.params.peerPubKey;
  request.delete(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Detach Peer Response', data: body});
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Detached', data: req.params.peerPubKey});
    logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnected'});
    res.status(204).json({});
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Peers', 'Disconnect Peer Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

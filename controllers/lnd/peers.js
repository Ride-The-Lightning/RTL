var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

getAliasForPeers = (peer) => {
  options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + peer.pub_key;
  return request(options).then(function(aliasBody) {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Alias: ' + JSON.stringify(aliasBody.node.alias)});
    peer.alias = aliasBody.node.alias;
    return aliasBody.node.alias;
  })
  .catch(err => {
    peer.alias = peer.pub_key.slice(0, 10) + '...' + peer.pub_key.slice(-10);
    return peer.pub_key;
  });
}

exports.getPeers = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Getting Peers...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peers Received: ' + JSON.stringify(body)});
    let peers = !body.peers ? [] : body.peers;
    return Promise.all(peers.map(peer => getAliasForPeers(peer))).then(function(values) {
      logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias before Sort: ' + JSON.stringify(body)});
      if (body.peers) {
        body.peers = common.sortDescByStrKey(body.peers, 'alias');
      }
      logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias after Sort: ' + JSON.stringify(body)});
      logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peers Received.'});
      res.status(200).json(body.peers);
    })
  }).catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Peers', msg: 'List Peers Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Peers List Failed!",
      error: err.error
    });
  });
};

exports.postPeer = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Connecting Peer...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers';
  options.form = JSON.stringify({ 
    addr: { host: req.body.host, pubkey: req.body.pubkey },
    perm: req.body.perm
  });
  request.post(options, (error, response, body) => {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Add Peer Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Adding peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      options.url = common.getSelLNServerUrl() + '/v1/peers';
      request(options).then(function (body) {
        let peers = (!body.peers) ? [] : body.peers;
        return Promise.all(peers.map(peer => getAliasForPeers(peer))).then(function(values) {
          if (body.peers) {
            body.peers = common.sortDescByStrKey(body.peers, 'alias');
            logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer with Alias: ' + JSON.stringify(body)});
            body.peers = common.newestOnTop(body.peers, 'pub_key', req.body.pubkey);
            logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(body)});
          }
          logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added Successfully'});
          logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peer Connected.'});
          res.status(201).json(body.peers);
        })
        .catch(errRes => {
          let err = JSON.parse(JSON.stringify(errRes));
          if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
            delete err.options.headers['Grpc-Metadata-macaroon'];
          }
          if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
            delete err.response.request.headers['Grpc-Metadata-macaroon'];
          }
          logger.log({level: 'ERROR', fileName: 'Peer', msg: 'Add Peer Error: ' + JSON.stringify(err)});
          return res.status(500).json({
            message: "Peer Add Failed!",
            error: err.error
          });
        });
      })
    }
  });
};

exports.deletePeer = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Disconnecting Peer...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers/' + req.params.peerPubKey;
  request.delete(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Detach Peer Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Detach Peer Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Detach peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Detached: ' + req.params.peerPubKey});
      logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnected.'});
      res.status(204).json({});
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Detach Peer Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Detach Peer Failed!",
      error: err.error
    });
  });
};

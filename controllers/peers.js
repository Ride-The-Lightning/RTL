var fs = require('fs');
var request = require('request-promise');
var options = require("../connect");
var common = require('../common');
var logger = require('./logger');

getAliasForPeers = (peer) => {
  return new Promise(function(resolve, reject) {
    options.url = common.lnd_server_url + '/graph/node/' + peer.pub_key;
    request(options)
    .then(function(aliasBody) {
      logger.info('\r\nPeers: 11: ' + JSON.stringify(Date.now()) + ': INFO: Alias: ' + JSON.stringify(aliasBody.node.alias));
      peer.alias = aliasBody.node.alias;
      resolve(aliasBody.node.alias);
    })
    .catch(err => resolve(''));
  });
}

exports.getPeers = (req, res, next) =>
{
  options.url = common.lnd_server_url + '/peers';
  request(options).then(function (body) {
    let peers = (undefined === body.peers) ? [] : body.peers;
    Promise.all(
      peers.map(peer => {
        return getAliasForPeers(peer);
      }))
    .then(function(values) {
      if (undefined !== body.peers) {
        body.peers = common.sortDescByKey(body.peers, 'alias');
      }
      logger.info('\r\nPeers: 29: ' + JSON.stringify(Date.now()) + ': INFO: Peers with Alias: ' + JSON.stringify(body));
      res.status(200).json(body.peers);
    });
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Peers Fetched Failed!",
      error: err.error
    });
  });
};

exports.postPeer = (req, res, next) => {
  options.url = common.lnd_server_url + '/peers';
  options.form = JSON.stringify({ 
    addr: { host: req.body.host, pubkey: req.body.pubkey },
    perm: req.body.perm
  });
  request.post(options, (error, response, body) => {
    logger.info('\r\nPeers: 48: ' + JSON.stringify(Date.now()) + ': INFO: Peer Added: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Adding peer failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      options.url = common.lnd_server_url + '/peers';
      request(options).then(function (body) {
        let peers = (undefined === body.peers) ? [] : body.peers;
        Promise.all(
          peers.map(peer => {
            return getAliasForPeers(peer);
          }))
        .then(function(values) {
          if (undefined !== body.peers) {
            body.peers = common.sortDescByKey(body.peers, 'alias');
            logger.info('\r\nPeers: 69: ' + JSON.stringify(Date.now()) + ': INFO: Peer with Alias: ' + JSON.stringify(body));
            body.peers = common.newestOnTop(body.peers, 'pub_key', req.body.pubkey);
            logger.info('\r\nPeers: 71: ' + JSON.stringify(Date.now()) + ': INFO: Peer with Newest On Top: ' + JSON.stringify(body));
          }
          logger.info('\r\nPeers: 73: ' + JSON.stringify(Date.now()) + ': INFO: Peer Added Successfully');
          res.status(201).json(body.peers);
        })
        .catch((err) => {
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
  options.url = common.lnd_server_url + '/peers/' + req.params.peerPubKey;
  request.delete(options).then((body) => {
    logger.info('\r\nPeers: 81: ' + JSON.stringify(Date.now()) + ': INFO: Detach Peer Response: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Detach peer failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.info('\r\nPeers: 88: ' + JSON.stringify(Date.now()) + ': INFO: Peer Detached: ' + req.params.peerPubKey);
      res.status(204).json({});
    }
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Detach Peer Failed!",
      error: err.error
    });
  });
};
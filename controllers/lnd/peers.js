var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

getAliasForPeers = (peer) => {
  return new Promise(function(resolve, reject) {
    options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + peer.pub_key;
    request(options).then(function(aliasBody) {
      logger.info({fileName: 'Peers', msg: 'Alias: ' + JSON.stringify(aliasBody.node.alias)});
      peer.alias = aliasBody.node.alias;
      resolve(aliasBody.node.alias);
    })
    .catch(err => {
      peer.alias = peer.pub_key.slice(0, 10) + '...' + peer.pub_key.slice(-10);
      resolve(peer.pub_key);  
    });
  });
}

exports.getPeers = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers';
  request(options).then(function (body) {
    logger.info({fileName: 'Peers', msg: 'Peers Received: ' + JSON.stringify(body)});
    let peers = !body.peers ? [] : body.peers;
    Promise.all(
      peers.map(peer => {
        return getAliasForPeers(peer);
      }))
    .then(function(values) {
      logger.info({fileName: 'Peers', msg: 'Peers with Alias before Sort: ' + JSON.stringify(body)});
      if (body.peers) {
        body.peers = common.sortDescByStrKey(body.peers, 'alias');
      }
      logger.info({fileName: 'Peers', msg: 'Peers with Alias after Sort: ' + JSON.stringify(body)});
      res.status(200).json(body.peers);
    });
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Peers', lineNum: 39, msg: 'List Peers Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Peers List Failed!",
      error: err.error
    });
  });
};

exports.postPeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers';
  options.form = JSON.stringify({ 
    addr: { host: req.body.host, pubkey: req.body.pubkey },
    perm: req.body.perm
  });
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Peers', msg: 'Peer Added: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Peers', lineNum: 63, msg: 'Add Peer Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Adding peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      options.url = common.getSelLNServerUrl() + '/v1/peers';
      request(options).then(function (body) {
        let peers = (!body.peers) ? [] : body.peers;
        Promise.all(
          peers.map(peer => {
            return getAliasForPeers(peer);
          }))
        .then(function(values) {
          if (body.peers) {
            body.peers = common.sortDescByStrKey(body.peers, 'alias');
            logger.info({fileName: 'Peers', msg: 'Peer with Alias: ' + JSON.stringify(body)});
            body.peers = common.newestOnTop(body.peers, 'pub_key', req.body.pubkey);
            logger.info({fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(body)});
          }
          logger.info({fileName: 'Peers', msg: 'Peer Added Successfully'});
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
          logger.error({fileName: 'Peer', lineNum: 93, msg: 'Add Peer Error: ' + JSON.stringify(err)});
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
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peers/' + req.params.peerPubKey;
  request.delete(options).then((body) => {
    logger.info({fileName: 'Peers', msg: 'Detach Peer Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Peers', lineNum: 110, msg: 'Detach Peer Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Detach peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.info({fileName: 'Peers', msg: 'Peer Detached: ' + req.params.peerPubKey});
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
    logger.error({fileName: 'Peers', lineNum: 127, msg: 'Detach Peer Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Detach Peer Failed!",
      error: err.error
    });
  });
};

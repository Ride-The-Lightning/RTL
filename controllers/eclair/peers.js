var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

getFilteredNodes = (peersNodeIds) => {
  return new Promise(function(resolve, reject) {
    options.url = common.getSelLNServerUrl() + '/nodes';
    options.form = { nodeIds: peersNodeIds };
    request.post(options).then(function(nodes) {
      logger.info({fileName: 'Peers', msg: 'Filtered Nodes: ' + JSON.stringify(nodes)});
      resolve(nodes);
    }).catch(err => {
      resolve([]);  
    });
  });
}

exports.getPeers = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peers';
  options.form = {};
  if (common.read_dummy_data) {
    common.getDummyData('Peers').then(function(data) { res.status(200).json(data); });
  } else {
    request.post(options).then(function (body) {
      logger.info({fileName: 'Peers', msg: 'Peers Received: ' + JSON.stringify(body)});
      if (body && body.length) {
        let peersNodeIds = '';
        body.forEach(peer => { peersNodeIds = peersNodeIds + ',' + peer.nodeId; });
        peersNodeIds = peersNodeIds.substring(1);
        getFilteredNodes(peersNodeIds).then(function(peersWithAlias) {
          let foundPeer = {};
          body.map(peer => {
            foundPeer = peersWithAlias.find(peerWithAlias => peer.nodeId === peerWithAlias.nodeId);
            peer.alias = foundPeer ? foundPeer.alias : peer.nodeId.substring(0, 20);
          });
          body = common.sortDescByStrKey(body, 'alias');
          logger.info({fileName: 'Peers', msg: 'Peers with Alias: ' + JSON.stringify(body)});
          res.status(200).json(body);
        });
      } else {
        res.status(200).json([]);
      }
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers.authorization) {
        delete err.options.headers.authorization;
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
        delete err.response.request.headers.authorization;
      }
      logger.error({fileName: 'Peers', lineNum: 49, msg: 'Get Peers Error: ' + JSON.stringify(err)});
      return res.status(err.statusCode ? err.statusCode : 500).json({
        message: 'Fetching Peers Failed!',
        error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
      });
    });
  }
};

exports.connectPeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/connect';
  options.form = {};
  if (req.query) {
    options.form = req.query;
    logger.info({fileName: 'Peers', msg: 'Connect Peer Params: ' + JSON.stringify(options.form)});
  }
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Peers', msg: 'Add Peer Response: ' + JSON.stringify(body)});
    if (body === 'already connected') {
      return res.status(500).json({
        message: "Connect Peer Failed!",
        error: "Already connected"
      });
    } else if (typeof body === 'string' && body.includes('connection failed')) {
      return res.status(500).json({
        message: "Connect Peer Failed!",
        error: body.charAt(0).toUpperCase() + body.slice(1)
      });
    }
    options.url = common.getSelLNServerUrl() + '/peers';
    options.form = {};
    request.post(options).then(function (body) {
      logger.info({fileName: 'Peers', msg: 'Peers Received: ' + JSON.stringify(body)});
      if (body && body.length) {
        let peersNodeIds = '';
        body.forEach(peer => { peersNodeIds = peersNodeIds + ',' + peer.nodeId; });
        peersNodeIds = peersNodeIds.substring(1);
        getFilteredNodes(peersNodeIds).then(function(peersWithAlias) {
          let foundPeer = {};
          body.map(peer => {
            foundPeer = peersWithAlias.find(peerWithAlias => peer.nodeId === peerWithAlias.nodeId);
            peer.alias = foundPeer ? foundPeer.alias : peer.nodeId.substring(0, 20);
          });
          let peers = (body) ? common.sortDescByStrKey(body, 'alias') : [];
          peers = common.newestOnTop(peers, 'nodeId', req.query.nodeId ? req.query.nodeId : req.query.uri ? req.query.uri.substring(0, req.query.uri.indexOf('@')) : '');
          logger.info({fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(peers)});
          logger.info({fileName: 'Peers', msg: 'Peer Added Successfully'});
          res.status(201).json(peers);
        });
      } else {
        res.status(201).json([]);
      }
    }).catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers.authorization) {
        delete err.options.headers.authorization;
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
        delete err.response.request.headers.authorization;
      }
      logger.error({fileName: 'Peers', lineNum: 89, msg: 'Connect Peer Error: ' + JSON.stringify(err)});
      return res.status(err.statusCode ? err.statusCode : 500).json({
        message: "Connect Peer Failed!",
        error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
      });
    });
  }).catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Peers', lineNum: 103, msg: 'Connect Peer Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Connect Peer Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.deletePeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/disconnect';
  options.form = {};
  if (req.params.nodeId) {
    options.form = { nodeId: req.params.nodeId };
    logger.info({fileName: 'Peers', msg: 'Disconnect Peer Params: ' + JSON.stringify(options.form)});
  }
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Peers', msg: 'Disconnect Peer Response: ' + JSON.stringify(body)});
    logger.info({fileName: 'Peers', msg: 'Peer Disconnected: ' + req.params.nodeId});
    res.status(204).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Peers', lineNum: 132, msg: 'Disconnect Peer Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Disconnect Peer Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

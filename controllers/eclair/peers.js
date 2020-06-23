var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getPeers = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peers';
  request.post(options).then(function (body) {
    logger.info({fileName: 'Peers', msg: 'Peers Received: ' + JSON.stringify(body)});
    body.forEach((peer, idx) => {
      peer.alias = peer.alias ? peer.alias : 'Node Alias ' + (idx + 1)
    });
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Peers', lineNum: 21, msg: 'Get Peers Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: 'Fetching Peers Failed!',
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.connectPeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/connect';
  // uri OR nodeId
  if (req.query) {
    options.form = req.query;
    logger.info({fileName: 'Peers', msg: 'Connect Peer Params: ' + JSON.stringify(options.form)});
  }
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Peers', msg: 'Add Peer Response: ' + JSON.stringify(body)});
    if (body === 'already connected') {
      return res.status(500).json({
        message: "Connect Peer Failed!",
        error: "already connected"
      });
    }
    options.url = common.getSelLNServerUrl() + '/peers';
    request.post(options).then(function (body) {
      let peers = (body) ? common.sortDescByStrKey(body, 'alias') : [];
      peers = common.newestOnTop(peers, 'nodeId', req.query.uri ? req.query.uri.substring(0, req.query.uri.indexOf('@')) : req.query.nodeId ? req.query.nodeId : '');
      logger.info({fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(peers)});
      logger.info({fileName: 'Peers', msg: 'Peer Added Successfully'});
      res.status(201).json(peers);
    }).catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers.authorization) {
        delete err.options.headers.authorization;
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
        delete err.response.request.headers.authorization;
      }
      logger.error({fileName: 'Peers', lineNum: 54, msg: 'Connect Peer Error: ' + JSON.stringify(err)});
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
    logger.error({fileName: 'Peers', lineNum: 68, msg: 'Connect Peer Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Connect Peer Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.deletePeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/disconnect';
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
    logger.error({fileName: 'Peers', lineNum: 91, msg: 'Disconnect Peer Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Disconnect Peer Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

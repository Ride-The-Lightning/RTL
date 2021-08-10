var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getPeers = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'List Peers..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peer/listPeers';
  request(options).then(function (body) {
    body.forEach(peer => { if (!peer.alias || peer.alias === '') { peer.alias = peer.id.substring(0, 20);}});
    let peers = (body) ? common.sortDescByStrKey(body, 'alias') : [];
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peers with Alias', data: peers});
    logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peers Received'});
    res.status(200).json(peers);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Peers List Error', error: err});
    return res.status(500).json({
      message: "Peers Fetch Failed!",
      error: err.error
    });
  });
};

exports.postPeer = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Connecting Peer..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peer/connect';
  options.body = req.body;
  request.post(options, (error, response, body) => {
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Connect Peer Error', error: body && body.error ? body.error : body ? body : ''});
      res.status(500).json({
        message: "Adding peer failed!",
        error: (!body) ? 'Error From Server!' : body.error ? body.error : 'Error From Server!'
      });
    } else {
      logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added', data: body});
      options.url = common.getSelLNServerUrl() + '/v1/peer/listPeers';
      request(options).then(function (body) {
        let peers = ( body) ? common.sortDescByStrKey(body, 'alias') : [];
        peers = common.newestOnTop(peers, 'id', req.body.id);
        logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer with Newest On Top', data: peers});
        logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Added Successfully'});
        logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peer Connected'});
        res.status(201).json(peers);
        }).catch(errRes => {
          let err = JSON.parse(JSON.stringify(errRes));
          if (err.options && err.options.headers && err.options.headers.macaroon) {
            delete err.options.headers.macaroon;
          }
          if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
            delete err.response.request.headers.macaroon;
          }
          logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Connect Peer Error', error: err});
          return res.status(500).json({
            message: "Peer Add Failed!",
            error: err.error
        });
      });
    }
  });
};

exports.deletePeer = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Peers', msg: 'Disconnecting Peer..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peer/disconnect/' + req.params.peerId + '?force=' + req.query.force;
  request.delete(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Detach Peer Response', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Detach Peer Error', error: body.error});
      res.status(500).json({
        message: "Detach peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'DEBUG', fileName: 'Peers', msg: 'Peer Detached', data: req.params.peerId});
      logger.log({level: 'INFO', fileName: 'Peers', msg: 'Peer Disconnected'});
      res.status(204).json({});
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Peers', msg: 'Detach Peer Error', error: err});
    return res.status(500).json({
      message: "Detach Peer Failed!",
      error: err.error
    });
  });
};

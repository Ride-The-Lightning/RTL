var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getPeers = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peer/listPeers';
  request(options).then(function (body) {
    body.forEach(peer => { if (!peer.alias || peer.alias === '') { peer.alias = peer.id.substring(0, 20);}});
    let peers = (body) ? common.sortDescByStrKey(body, 'alias') : [];
    logger.info({fileName: 'Peers', msg: 'Peers with Alias: ' + JSON.stringify(peers)});
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
    logger.error({fileName: 'Peers', lineNum: 21, msg: 'Peers List Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Peers Fetch Failed!",
      error: err.error
    });
  });
};

exports.postPeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peer/connect';
  options.body = req.body;
  request.post(options, (error, response, body) => {
    if(!body || body.error) {
      logger.error({fileName: 'Peers', lineNum: 35, msg: 'Connect Peer Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Adding peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.info({fileName: 'Peers', msg: 'Peer Added: ' + JSON.stringify(body)});
      options.url = common.getSelLNServerUrl() + '/v1/peer/listPeers';
      request(options).then(function (body) {
        let peers = ( body) ? common.sortDescByStrKey(body, 'alias') : [];
        peers = common.newestOnTop(peers, 'id', req.body.id);
        logger.info({fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(peers)});
        logger.info({fileName: 'Peers', msg: 'Peer Added Successfully'});
        res.status(201).json(peers);
        }).catch(errRes => {
          let err = JSON.parse(JSON.stringify(errRes));
          if (err.options && err.options.headers && err.options.headers.macaroon) {
            delete err.options.headers.macaroon;
          }
          if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
            delete err.response.request.headers.macaroon;
          }
          logger.error({fileName: 'Peers', lineNum: 56, msg: 'Connect Peer Error: ' + JSON.stringify(err)});
          return res.status(500).json({
            message: "Peer Add Failed!",
            error: err.error
        });
      });
    }
  });
};

exports.deletePeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/peer/disconnect/' + req.params.peerId + '?force=' + req.query.force;
  request.delete(options).then((body) => {
    logger.info({fileName: 'Peers', msg: 'Detach Peer Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Peers', lineNum: 72, msg: 'Detach Peer Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Detach peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.info({fileName: 'Peers', msg: 'Peer Detached: ' + req.params.peerId});
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
    logger.error({fileName: 'Peers', lineNum: 89, msg: 'Detach Peer Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Detach Peer Failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getPeers = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peer/listPeers';
  request(options).then(function (body) {
    let peers = ( body) ? common.sortDescByStrKey(body, 'alias') : [];
    logger.info({fileName: 'Peers', msg: 'Peers with Alias: ' + JSON.stringify(peers)});
    res.status(200).json(peers);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Peers Fetch Failed!",
      error: err.error
    });
  });
};

exports.postPeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peer/connect';
  options.body = req.body;
  request.post(options, (error, response, body) => {
    if(!body || body.error) {
      res.status(500).json({
        message: "Adding peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.info({fileName: 'Peers', msg: 'Peer Added: ' + JSON.stringify(body)});
      options.url = common.getSelLNServerUrl() + '/peer/listPeers';
      request(options).then(function (body) {
        let peers = ( body) ? common.sortDescByStrKey(body, 'alias') : [];
        peers = common.newestOnTop(peers, 'id', req.body.id);
        logger.info({fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(peers)});
        logger.info({fileName: 'Peers', msg: 'Peer Added Successfully'});
        res.status(201).json(peers);
        }).catch((err) => {
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
  options.url = common.getSelLNServerUrl() + '/peer/disconnect/' + req.params.peerId + '?force=' + req.query.force;
  request.delete(options).then((body) => {
    logger.info({fileName: 'Peers', msg: 'Detach Peer Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      res.status(500).json({
        message: "Detach peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.info({fileName: 'Peers', msg: 'Peer Detached: ' + req.params.peerId});
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
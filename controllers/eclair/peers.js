var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getPeers = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peers';
  request.post(options).then(function (body) {
    logger.info({fileName: 'Peers', msg: 'Peers Received: ' + JSON.stringify(body)});
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
    if(!body || body.error) {
      logger.error({fileName: 'Peers', lineNum: 41, msg: 'Connect Peer Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Adding peer failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.info({fileName: 'Peers', msg: 'Peer Added: ' + JSON.stringify(body)});
      options.url = common.getSelLNServerUrl() + '/peers';
      request.post(options).then(function (body) {
        let peers = ( body) ? common.sortDescByStrKey(body, 'alias') : [];
        peers = common.newestOnTop(peers, 'id', req.body.nodeId);
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
          logger.error({fileName: 'Peers', lineNum: 63, msg: 'Connect Peer Error: ' + JSON.stringify(err)});
          return res.status(err.statusCode ? err.statusCode : 500).json({
            message: "Connect Peer Failed!",
            error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
          });
        });
    }
  });
};

exports.deletePeer = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/disconnect';
  if (req.route.nodeId) {
    options.form = { nodeId: req.route.nodeId };
    logger.info({fileName: 'Peers', msg: 'Disconnect Peer Params: ' + JSON.stringify(options.form)});
  }
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Peers', msg: 'Disconnect Peer Response: ' + JSON.stringify(body)});
    logger.info({fileName: 'Peers', msg: 'Peer Disconnected: ' + req.params.peerId});
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

var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getRoute = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/network/getRoute/' + req.params.destPubkey + '/' + req.params.amount;
  request(options).then((body) => {
    logger.info({fileName: 'Network', msg: 'Query Routes Received: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching Query Routes Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    }
    res.status(200).json({routes: body});
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fetching Query Routes Failed!",
      error: err.error
    });
  });
};

exports.listNode = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peer/listPeers';
  request(options).then(function (body) {
    let peers = (undefined !== body) ? common.sortDescByKey(body, 'alias') : [];
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

exports.listChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peer/listPeers';
  request(options).then(function (body) {
    let peers = (undefined !== body) ? common.sortDescByKey(body, 'alias') : [];
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

exports.feeRates = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/peer/listPeers';
  request(options).then(function (body) {
    let peers = (undefined !== body) ? common.sortDescByKey(body, 'alias') : [];
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

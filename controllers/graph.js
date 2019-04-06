var request = require("request-promise");
var common = require('../common');
var logger = require('./logger');
var options = {};

exports.getDescribeGraph = (req, res, next) => {
  options = common.getOptions('');
  options.url = common.lnd_server_url + '/graph';
  request.get(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    logger.info('\r\nGraph: 10: ' + JSON.stringify(Date.now()) + ': INFO: Describe Graph Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching Describe Graph Failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
    }
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fetching Describe Graph Failed!",
      error: err.error
    });
  });
};

exports.getGraphInfo = (req, res, next) => {
  options = common.getOptions('');
  options.url = common.lnd_server_url + '/graph/info';
  request.get(options).then((body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    logger.info('\r\nGraph: 33: ' + JSON.stringify(Date.now()) + ': INFO: Network Info Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching network Info failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.btc_total_network_capacity = (undefined === body.total_network_capacity) ? 0 : common.convertToBTC(body.total_network_capacity);
      body.btc_avg_channel_size = (undefined === body.avg_channel_size) ? 0 : common.convertToBTC(body.avg_channel_size);
      body.btc_min_channel_size = (undefined === body.min_channel_size) ? 0 : common.convertToBTC(body.min_channel_size);
      body.btc_max_channel_size = (undefined === body.max_channel_size) ? 0 : common.convertToBTC(body.max_channel_size);
      logger.info('\r\nGraph: 44: ' + JSON.stringify(Date.now()) + ': INFO: Network Information After Rounding and Conversion: ' + body_str);
      res.status(200).json(body);
    }
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fetching network Info failed!",
      error: err.error
    });
  });
};

exports.getGraphNode = (req, res, next) => {
  options = common.getOptions('');
  options.url = common.lnd_server_url + '/graph/node/' + req.params.pubKey;
  request(options).then((body) => {
    logger.info('\r\nGraph: 59: ' + JSON.stringify(Date.now()) + ': INFO: Node Info Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching node Info failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    }
    if (undefined !== body) {
      body.node.last_update_str =  (undefined === body.node.last_update) ? '' : common.convertTimestampToDate(body.node.last_update);
    }
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fetching node Info failed!",
      error: err.error
    });
  });  
};

exports.getGraphEdge = (req, res, next) => {
  options = common.getOptions('');
  options.url = common.lnd_server_url + '/graph/edge/' + req.params.chanid;
  request(options).then((body) => {
    logger.info('\r\nGraph: 79: ' + JSON.stringify(Date.now()) + ': INFO: Edge Info Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching Edge Info Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    }
    if (undefined !== body) {
      body.last_update_str =  (undefined === body.last_update) ? '' : common.convertTimestampToDate(body.last_update);
    }
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Fetching Edge Info Failed!",
      error: err.error
    });
  });  
};

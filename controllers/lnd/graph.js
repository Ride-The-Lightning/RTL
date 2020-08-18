var request = require("request-promise");
var common = require('../../common');
var logger = require('../logger');
var options = {};

getAliasFromPubkey = (hop) => {
  return new Promise(function(resolve, reject) {
    options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + hop.pub_key;
    request(options)
    .then(function(aliasBody) {
      logger.info({fileName: 'Graph', msg: 'Alias: ' + JSON.stringify(aliasBody.node.alias)});
      hop.pubkey_alias = aliasBody.node.alias;
      resolve(hop);
    })
    .catch(err => resolve(''));
  });
}

exports.getDescribeGraph = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph';
  request.get(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'Graph', msg: 'Describe Graph Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.error({fileName: 'Graph', lineNum: 27, msg: 'Describe Graph Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Describe Graph Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
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
    logger.error({fileName: 'Graph', lineNum: 43, msg: 'Describe Graph Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Describe Graph Failed!",
      error: err.error
    });
  });
};

exports.getGraphInfo = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/info';
  request.get(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'Graph', msg: 'Network Info Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.error({fileName: 'Graph', lineNum: 59, msg: 'Network Info Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching network Info failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.btc_total_network_capacity = (!body.total_network_capacity) ? 0 : common.convertToBTC(body.total_network_capacity);
      body.btc_avg_channel_size = (!body.avg_channel_size) ? 0 : common.convertToBTC(body.avg_channel_size);
      body.btc_min_channel_size = (!body.min_channel_size) ? 0 : common.convertToBTC(body.min_channel_size);
      body.btc_max_channel_size = (!body.max_channel_size) ? 0 : common.convertToBTC(body.max_channel_size);
      logger.info({fileName: 'Graph', msg: 'Network Information After Rounding and Conversion: ' + body_str});
      res.status(200).json(body);
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
    logger.error({fileName: 'Graph', lineNum: 80, msg: 'Fetch Network Info Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching network Info failed!",
      error: err.error
    });
  });
};

exports.getGraphNode = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + req.params.pubKey;
  request(options).then((body) => {
    logger.info({fileName: 'Graph', msg: 'Node Info Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Graph', lineNum: 94, msg: 'Fetch Node Info Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching node Info failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    if (body) {
      body.node.last_update_str =  (!body.node.last_update) ? '' : common.convertTimestampToDate(body.node.last_update);
    }
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Graph', lineNum: 112, msg: 'Fetch Node Info Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching node Info failed!",
      error: err.error
    });
  });  
};

exports.getGraphEdge = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/edge/' + req.params.chanid;
  request(options).then((body) => {
    logger.info({fileName: 'Graph', msg: 'Edge Info Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Graph', lineNum: 126, msg: 'Fetch Edge Info Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Edge Info Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    if (body) {
      body.last_update_str =  (!body.last_update) ? '' : common.convertTimestampToDate(body.last_update);
    }
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Graph', lineNum: 144, msg: 'Fetch Edge Info Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Edge Info Failed!",
      error: err.error
    });
  });  
};

exports.getQueryRoutes = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/routes/' + req.params.destPubkey + '/' + req.params.amount;
  if(req.query.outgoing_chan_id) {
    options.url = options.url + '?outgoing_chan_id=' + req.query.outgoing_chan_id;
  }
  logger.info({fileName: 'Graph', msg: 'Query Routes URL: ' + options.url});
  request(options).then((body) => {
    logger.info({fileName: 'Graph', msg: 'Query Routes Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Graph', lineNum: 162, msg: 'Fetch Query Routes Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Query Routes Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    if (body.routes && body.routes.length > 0) {
      body.routes.forEach(route => {
        if ( route.hops) {
          Promise.all(
            route.hops.map((hop, i) => {
              hop.hop_sequence = i + 1;
              return getAliasFromPubkey(hop);
            })
          )
          .then(function(values) {
            logger.info({fileName: 'Graph', msg: 'Hops with Alias: ' + JSON.stringify(body)});
            res.status(200).json(body);
          })
          .catch(errRes => {
            let err = JSON.parse(JSON.stringify(errRes));
            if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
              delete err.options.headers['Grpc-Metadata-macaroon'];
            }
            if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
              delete err.response.request.headers['Grpc-Metadata-macaroon'];
            }
            logger.error({fileName: 'Graph', lineNum: 187, msg: 'Fetch Query Routes Error: ' + JSON.stringify(err)});
            return res.status(500).json({
              message: "Fetching Query Routes Failed!",
              error: err.error
            });
          });    
        }
      });
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
    logger.error({fileName: 'Graph', lineNum: 204, msg: 'Fetch Query Routes Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Query Routes Failed!",
      error: err.error
    });
  });
};

exports.getRemoteFeePolicy = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/edge/' + req.params.chanid;
  request(options).then((body) => {
    logger.info({fileName: 'Graph', msg: 'Edge Info Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Graph', lineNum: 218, msg: 'Fetch Edge Info Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Edge Info Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    if (body) {
      body.last_update_str =  (!body.last_update) ? '' : common.convertTimestampToDate(body.last_update);
    }
    remoteNodeFee = {};
    if(body.node1_pub === req.params.localPubkey){
      remoteNodeFee = {
        time_lock_delta: body.node2_policy.time_lock_delta,
        fee_base_msat: body.node2_policy.fee_base_msat,
        fee_rate_milli_msat: body.node2_policy.fee_rate_milli_msat
      };
    } else if(body.node2_pub === req.params.localPubkey) {
      remoteNodeFee = {
        time_lock_delta: body.node1_policy.time_lock_delta,
        fee_base_msat: body.node1_policy.fee_base_msat,
        fee_rate_milli_msat: body.node1_policy.fee_rate_milli_msat
      };
    }
    res.status(200).json(remoteNodeFee);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Graph', lineNum: 250, msg: 'Fetch Edge Info Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Edge Info Failed!",
      error: err.error
    });
  });
};

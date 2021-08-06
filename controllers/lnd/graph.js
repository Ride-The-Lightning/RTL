var request = require("request-promise");
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

getAliasFromPubkey = (pubkey) => {
  options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + pubkey;
  return request(options).then(function(res) {
    logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Alias', data: res.node.alias});
    return res.node.alias;
  })
  .catch(err => pubkey.substring(0, 17) + '...');
}

exports.getDescribeGraph = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Graph', msg: 'Getting Network Graph..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph';
  request.get(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Describe Graph Received', data: body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Describe Graph Error', error: body.error});
      res.status(500).json({
        message: "Fetching Describe Graph Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Graph', msg: 'Network Graph Received'});
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
    logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Describe Graph Error', error: err});
    return res.status(500).json({
      message: "Fetching Describe Graph Failed!",
      error: err.error
    });
  });
};

exports.getGraphInfo = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Information..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/info';
  request.get(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Network Info Received', data: body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Network Info Error', error: body.error});
      res.status(500).json({
        message: "Fetching network Info failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Network Information After Rounding and Conversion', data: body_str});
      logger.log({level: 'INFO', fileName: 'Graph', msg: 'Graph Information Received'});
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
    logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Network Info Error', error: err});
    return res.status(500).json({
      message: "Fetching network Info failed!",
      error: err.error
    });
  });
};

exports.getGraphNode = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Node Information..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + req.params.pubKey;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Node Info Received', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Node Info Error', error: body.error});
      res.status(500).json({
        message: "Fetching node Info failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    logger.log({level: 'INFO', fileName: 'Graph', msg: 'Graph Node Information Received'});
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
    logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Node Info Error', error: err});
    return res.status(500).json({
      message: "Fetching node Info failed!",
      error: err.error
    });
  });  
};

exports.getGraphEdge = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Edge Information..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/edge/' + req.params.chanid;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Edge Info Received', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Edge Info Error', error: body.error});
      res.status(500).json({
        message: "Fetching Edge Info Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    logger.log({level: 'INFO', fileName: 'Graph', msg: 'Graph Edge Information Received'});
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
    logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Edge Info Error', error: err});
    return res.status(500).json({
      message: "Fetching Edge Info Failed!",
      error: err.error
    });
  });  
};

exports.getQueryRoutes = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Routes..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/routes/' + req.params.destPubkey + '/' + req.params.amount;
  if(req.query.outgoing_chan_id) {
    options.url = options.url + '?outgoing_chan_id=' + req.query.outgoing_chan_id;
  }
  logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Query Routes URL', data: options.url});
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Query Routes Received', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Query Routes Error', error: body.error});
      res.status(500).json({
        message: "Fetching Query Routes Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    if(body.routes && body.routes.length && body.routes.length > 0 && body.routes[0].hops && body.routes[0].hops.length && body.routes[0].hops.length > 0) {
      return Promise.all(body.routes[0].hops.map(hop => getAliasFromPubkey(hop.pub_key)))
      .then(function(values) {
        body.routes[0].hops.map((hop, i) => { 
          hop.hop_sequence = i + 1;
          hop.pubkey_alias = values[i];
          return hop;
        });
        logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Hops with Alias', data: body});
        logger.log({level: 'INFO', fileName: 'Graph', msg: 'Graph Routes Received'});
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
        logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Query Routes Error', error: err});
        return res.status(500).json({
          message: "Fetching Query Routes Failed!",
          error: err.error
        });
      });    
    } else {
      logger.log({level: 'INFO', fileName: 'Graph', msg: 'Graph Routes Received'});
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
    logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Query Routes Error', error: err});
    return res.status(500).json({
      message: "Fetching Query Routes Failed!",
      error: err.error
    });
  });
};

exports.getRemoteFeePolicy = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Graph', msg: 'Getting Remote Fee Policy..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/graph/edge/' + req.params.chanid;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Edge Info Received', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Edge Info Error', error: body.error});
      res.status(500).json({
        message: "Fetching Edge Info Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
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
    logger.log({level: 'INFO', fileName: 'Graph', msg: 'Remote Fee Policy Received'});
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
    logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Fetch Edge Info Error', error: err});
    return res.status(500).json({
      message: "Fetching Edge Info Failed!",
      error: err.error
    });
  });
};

exports.getAliasesForPubkeys = (req, res, next) => {
  options = common.getOptions();
  if (req.query.pubkeys) {
    let pubkeyArr = req.query.pubkeys.split(',');
    return Promise.all(pubkeyArr.map(pubkey => getAliasFromPubkey(pubkey)))
    .then(function(values) {
      logger.log({level: 'DEBUG', fileName: 'Graph', msg: 'Node Alias', data: values});
      res.status(200).json(values);
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.log({level: 'ERROR', fileName: 'Graph', msg: 'Get Aliases for Pubkeys Error', error: err});
      return res.status(500).json({
        message: "Getting Aliases for Pubkeys Failed!",
        error: err.error
      });
    });    
  } else {
    res.status(200).json([]);
  }
};

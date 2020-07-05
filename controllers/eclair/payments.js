var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

getQueryNodes = (nodeIds) => {
  return new Promise(function(resolve, reject) {
    options.url = common.getSelLNServerUrl() + '/nodes';
    options.form = { nodeIds: nodeIds };
    request.post(options).then(function(nodes) {
      logger.info({fileName: 'Payments', msg: 'Query Nodes: ' + JSON.stringify(nodes)});
      resolve(nodes);
    }).catch(err => {
      resolve([]);  
    });
  });
}

exports.decodePayment = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/parseinvoice';
  options.form = { invoice: req.params.invoice };
  request.post(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Payment Decode Received: ' + JSON.stringify(body)});
    body.timestampStr =  (!body.timestamp) ? '' : common.convertTimestampToDate(body.timestamp);
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
    logger.error({fileName: 'Payments', lineNum: 22, msg: 'Payment Decode Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Payment Decode Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.postPayment = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/payinvoice';
  options.form = req.body;
  request.post(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Send Payment Response: ' + JSON.stringify(body)});
    res.status(201).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Payments', lineNum: 46, msg: 'Send Payment Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Send Payment Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.queryPaymentRoute = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/findroutetonode';
  options.form = {
    nodeId: req.query.nodeId,
    amountMsat: req.query.amountMsat
  };
  request.post(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Query Payment Route Received: ' + JSON.stringify(body)});
    if (body && body.length) {
      let queryRoutes = [];
      getQueryNodes(body).then(function(hopsWithAlias) {
        let foundPeer = {};
        body.map(hop => {
          foundPeer = hopsWithAlias.find(hopWithAlias => hop === hopWithAlias.nodeId);
          queryRoutes.push({nodeId: hop, alias: foundPeer ? foundPeer.alias : ''});
        });
        logger.info({fileName: 'Payments', msg: 'Query Routes with Alias: ' + JSON.stringify(queryRoutes)});
        res.status(200).json(queryRoutes);
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
    logger.error({fileName: 'Payments', lineNum: 109, msg: 'Query Payment Route Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Query Payment Route Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

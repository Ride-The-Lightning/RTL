var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
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
    if (body.amount) { body.amount = Math.round(body.amount/1000); }
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

exports.getSentPaymentsInformation = (req, res, next) => {
  options = common.getOptions();
  if (req.body.payments) {
    let paymentsArr = req.body.payments.split(',');
    Promise.all(paymentsArr.map(payment => {return getSentInfoFromPaymentRequest(payment)}))
    .then(function(values) {
      logger.info({fileName: 'Payments', msg: 'Payment Sent Informations: ' + JSON.stringify(values)});
      res.status(200).json(values);
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers.authorization) {
        delete err.options.headers.authorization;
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
        delete err.response.request.headers.authorization;
      }
      logger.error({fileName: 'Payments', lineNum: 126, msg: 'Payment Sent Information Error: ' + JSON.stringify(err)});
      return res.status(err.statusCode ? err.statusCode : 500).json({
        message: "Payment Sent Information Failed!",
        error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
      });
    });
  } else {
    res.status(200).json([]);
  }
};

getSentInfoFromPaymentRequest = (payment) => {
  options.url = common.getSelLNServerUrl() + '/getsentinfo';    
  options.form = { paymentHash: payment };
  return new Promise(function(resolve, reject) {
    request.post(options).then((body) => {
      logger.info({fileName: 'Payments', msg: 'Payment Sent Information Received: ' + JSON.stringify(body)});
      body.forEach(sentPayment => {
        sentPayment.createdAtStr =  (!sentPayment.createdAt) ? '' : common.convertTimestampToDate(sentPayment.createdAt);
        if (sentPayment.amount) { sentPayment.amount = Math.round(sentPayment.amount/1000); }
        if (sentPayment.recipientAmount) { sentPayment.recipientAmount = Math.round(sentPayment.recipientAmount/1000); }
      });
      resolve(body);
    })
    .catch(err => resolve(err));
  });
}
var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

getQueryNodes = (nodeIds) => {
  options.url = common.getSelLNServerUrl() + '/nodes';
  options.form = { nodeIds: nodeIds };
  return request.post(options).then(function(nodes) {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Query Nodes: ' + JSON.stringify(nodes)});
    return nodes;
  }).catch(err => {
    return [];  
  });
}

exports.decodePayment = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'Decoding Payment...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/parseinvoice';
  options.form = { invoice: req.params.invoice };
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Payment Decode Received: ' + JSON.stringify(body)});
    if (body.amount) { body.amount = Math.round(body.amount/1000); }
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Payment Decoded.'});
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
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'Paying Invoice...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/payinvoice';
  options.form = req.body;
  logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Send Payment Options: ' + JSON.stringify(options.form)});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Send Payment Response: ' + JSON.stringify(body)});
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Invoice Paid.'});
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
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'Querying Payment Route...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/findroutetonode';
  options.form = {
    nodeId: req.query.nodeId,
    amountMsat: req.query.amountMsat
  };
  logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Query Payment Route Options: ' + JSON.stringify(options.form)});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Query Payment Route Received: ' + JSON.stringify(body)});
    if (body && body.length) {
      let queryRoutes = [];
      return getQueryNodes(body).then(function(hopsWithAlias) {
        let foundPeer = {};
        body.map(hop => {
          foundPeer = hopsWithAlias.find(hopWithAlias => hop === hopWithAlias.nodeId);
          queryRoutes.push({nodeId: hop, alias: foundPeer ? foundPeer.alias : ''});
        });
        logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Query Routes with Alias: ' + JSON.stringify(queryRoutes)});
        logger.log({level: 'INFO', fileName: 'Payments', msg: 'Payment Route Information Received.'});
        res.status(200).json(queryRoutes);
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Payments', msg: 'Empty Payment Route Information Received.'});
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
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'Getting Sent Payment Information...'});
  options = common.getOptions();
  if (req.body.payments) {
    let paymentsArr = req.body.payments.split(',');
    return Promise.all(paymentsArr.map(payment => {return getSentInfoFromPaymentRequest(payment)}))
    .then(function(values) {
      logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Payment Sent Informations: ' + JSON.stringify(values)});
      logger.log({level: 'INFO', fileName: 'Payments', msg: 'Sent Payment Information Received.'});
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
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Empty Sent Payment Information Received.'});
    res.status(200).json([]);
  }
};

getSentInfoFromPaymentRequest = (payment) => {
  options.url = common.getSelLNServerUrl() + '/getsentinfo';    
  options.form = { paymentHash: payment };
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Payment Sent Information Received: ' + JSON.stringify(body)});
    body.forEach(sentPayment => {
      if (sentPayment.amount) { sentPayment.amount = Math.round(sentPayment.amount/1000); }
      if (sentPayment.recipientAmount) { sentPayment.recipientAmount = Math.round(sentPayment.recipientAmount/1000); }
    });
    return body;
  })
  .catch(err => err);
}
var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

arrangeBalances = (body) => {
  if(!body.confirmed) {
    body.confirmed = 0;
    body.btc_confirmed = 0;
  } else {
    body.btc_confirmed = common.convertToBTC(body.confirmed);
  }
  if(!body.unconfirmed) {
    body.unconfirmed = 0;
    body.btc_unconfirmed = 0;
  } else {
    body.btc_unconfirmed = common.convertToBTC(body.unconfirmed);
  }
  body.total = +body.confirmed + +body.unconfirmed;
  body.btc_total = +body.btc_confirmed + +body.btc_unconfirmed;
  return body;
};

exports.getNewAddress = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getnewaddress';
  options.form = {};
  request.post(options).then((body) => {
    logger.info({fileName: 'Onchain', msg: JSON.stringify(body)});
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
    logger.error({fileName: 'Onchain', lineNum: 21, msg: 'Get New Address Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Getting New Address failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.getBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/onchainbalance';
  options.form = {};
  if (common.read_dummy_data) {
    common.getDummyData('OnChainBalance').then(function(data) { res.status(200).json(arrangeBalances(data)); });
  } else {
    request.post(options).then((body) => {
      logger.info({fileName: 'Onchain', msg: 'Balance Received: ' + JSON.stringify(body)});
      res.status(200).json(arrangeBalances(body));
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers.authorization) {
        delete err.options.headers.authorization;
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
        delete err.response.request.headers.authorization;
      }
      logger.error({fileName: 'Onchain', lineNum: 58, msg: 'Fetch Balance Error: ' + JSON.stringify(err)});
      return res.status(err.statusCode ? err.statusCode : 500).json({
        message: "Fetching balance failed!",
        error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
      });
    });
  }
};

exports.getTransactions = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/onchaintransactions';
  options.form = { 
    count: req.query.count,
    skip: req.query.skip
  };
  request.post(options).then((body) => {
    logger.info({fileName: 'Transactions', msg: 'Transaction Received: ' + JSON.stringify(body)});
    if (body && body.length > 0) {
      body.forEach(transaction => {
        transaction.timestampStr =  (!transaction.timestamp) ? '' : common.convertTimestampToDate(transaction.timestamp);
      });
      body = common.sortDescByKey(body, 'timestamp');
    }
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
    logger.error({fileName: 'Onchain', lineNum: 101, msg: 'Get Transactions Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Getting transactions failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.sendFunds = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/sendonchain';
  options.form = { 
    address: req.body.address,
    amountSatoshis: req.body.amount,
    confirmationTarget: req.body.blocks
  };
  request.post(options).then((body) => {
    logger.info({fileName: 'Onchain', msg: 'Send Funds Response: ' + JSON.stringify(body)});
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
    logger.error({fileName: 'Onchain', lineNum: 129, msg: 'Send Funds Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Send funds failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

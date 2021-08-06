var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

arrangeBalances = (body) => {
  if(!body.confirmed) {
    body.confirmed = 0;
  }
  if(!body.unconfirmed) {
    body.unconfirmed = 0;
  }
  body.total = +body.confirmed + +body.unconfirmed;
  body.btc_total = +body.btc_confirmed + +body.btc_unconfirmed;
  return body;
};

exports.getNewAddress = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'OnChain', msg: 'Generating New Address..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getnewaddress';
  options.form = {};
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Onchain', msg: 'New Address Generated', data: body});
    logger.log({level: 'INFO', fileName: 'OnChain', msg: 'New Address Generated'});
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
    logger.log({level: 'ERROR', fileName: 'Onchain', msg: 'Get New Address Error', error: err});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Getting New Address failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.getBalance = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'OnChain', msg: 'Getting On Chain Balance..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/onchainbalance';
  options.form = {};
  if (common.read_dummy_data) {
    common.getDummyData('OnChainBalance').then(function(data) { res.status(200).json(arrangeBalances(data)); });
  } else {
    request.post(options).then((body) => {
      logger.log({level: 'DEBUG', fileName: 'Onchain', msg: 'Balance Received', data: body});
      logger.log({level: 'INFO', fileName: 'OnChain', msg: 'On Chain Balance Received'});
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
      logger.log({level: 'ERROR', fileName: 'Onchain', msg: 'Fetch Balance Error', error: err});
      return res.status(err.statusCode ? err.statusCode : 500).json({
        message: "Fetching balance failed!",
        error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
      });
    });
  }
};

exports.getTransactions = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'OnChain', msg: 'Getting On Chain Transactions..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/onchaintransactions';
  options.form = { 
    count: req.query.count,
    skip: req.query.skip
  };
  logger.log({level: 'DEBUG', fileName: 'OnChain', msg: 'Getting On Chain Transactions Options', data: options.form});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'OnChain', msg: 'Transaction Received', data: body});
    if (body && body.length > 0) {
      body = common.sortDescByKey(body, 'timestamp');
    }
    logger.log({level: 'INFO', fileName: 'OnChain', msg: 'On Chain Transaction Received'});
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
    logger.log({level: 'ERROR', fileName: 'Onchain', msg: 'Get Transactions Error', error: err});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Getting transactions failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.sendFunds = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'OnChain', msg: 'Sending On Chain Funds..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/sendonchain';
  options.form = { 
    address: req.body.address,
    amountSatoshis: req.body.amount,
    confirmationTarget: req.body.blocks
  };
  logger.log({level: 'DEBUG', fileName: 'Onchain', msg: 'Send Funds Options', data: options.form});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Onchain', msg: 'Send Funds Response', data: body});
    logger.log({level: 'INFO', fileName: 'OnChain', msg: 'On Chain Fund Sent'});
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
    logger.log({level: 'ERROR', fileName: 'Onchain', msg: 'Send Funds Error', error: err});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Send funds failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

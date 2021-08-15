var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getTransactions = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Transactions', msg: 'Getting Transactions..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/transactions';
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.log({level: 'DEBUG', fileName: 'Transactions', msg: 'Transaction Received', data: body_str});
    if (!body || search_idx > -1 || body.error) {
      logger.log({level: 'ERROR', fileName: 'Transactions', msg: 'List Transactions Error', error: body.error});
      res.status(500).json({
        message: "Fetching Transactions Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if (body.transactions && body.transactions.length > 0) {
        body.transactions = common.sortDescByKey(body.transactions, 'time_stamp');
      }
      logger.log({level: 'INFO', fileName: 'Transactions', msg: 'Transactions Received'});
      res.status(200).json(body.transactions);
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
    logger.log({level: 'ERROR', fileName: 'Transactions', msg: 'List Transactions Error', error: err});
    return res.status(500).json({
      message: "Fetching Transactions Failed!",
      error: err.error
    });
  });
};

exports.postTransactions = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Transactions', msg: 'Sending Transaction..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/transactions';
  options.form = { 
    amount: req.body.amount,
    addr: req.body.address,
    sat_per_byte: req.body.fees,
    target_conf: req.body.blocks
  };
  if (req.body.sendAll) {
    options.form.send_all = req.body.sendAll;
  }
  options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Transactions', msg: 'Transaction Post Response', data: body});
    if (!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Transactions', msg: 'Post Transaction Error', error: body.error});
      res.status(500).json({
        message: "Transactions post failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Transactions', msg: 'Transaction Sent'});
      res.status(201).json(body);
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
    logger.log({level: 'ERROR', fileName: 'Transactions', msg: 'Transaction Post Error', error: err});
    return res.status(500).json({
      message: "Transactions post failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getNewAddress = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'OnChain', msg: 'Generating New Address..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/newaddr?addrType=' + req.query.type;
  request(options).then((body) => {
    logger.log({level: 'INFO', fileName: 'OnChain', msg: 'New Address Generated'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'OnChain', msg: 'OnChain New Address Error', error: err});
    return res.status(500).json({
      message: "Fetching new address failed!",
      error: err.error
    });
  });
};

exports.onChainWithdraw = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'OnChain', msg: 'Withdrawing from On Chain..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/withdraw';
  options.body = req.body;
  logger.log({level: 'DEBUG', fileName: 'OnChain', msg: 'OnChain Withdraw Options', data: options.body});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'OnChain', msg: 'OnChain Withdraw Response', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'OnChain', msg: 'OnChain Withdraw Error', error: body.error});
      res.status(500).json({
        message: 'OnChain Withdraw Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'OnChain', msg: 'Withdraw Finished'});
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'OnChain', msg: 'OnChain Withdraw Error', error: err});
    return res.status(500).json({
      message: 'OnChain Withdraw Failed!',
      error: err
    });
  });
}

exports.getUTXOs = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'OnChain', msg: 'List Funds..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/listFunds';
  request(options).then((body) => {
    if (body.outputs) { body.outputs = common.sortDescByStrKey(body.outputs, 'status'); }
    logger.log({level: 'INFO', fileName: 'OnChain', msg: 'List Funds Received'});
    res.status(200).json(body);
  }).catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'OnChain', msg: 'OnChain List Funds Error', error: err});
    return res.status(500).json({
      message: "Fetching list funds failed!",
      error: err.error
    });
  });
};

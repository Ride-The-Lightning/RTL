var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getNewAddress = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/newaddr?addrType=' + req.query.type;
  request(options).then((body) => {
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
    logger.error({fileName: 'OnChain', lineNum: 19, msg: 'OnChain New Address Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching new address failed!",
      error: err.error
    });
  });
};

exports.onChainWithdraw = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/withdraw';
  options.body = req.body;
  logger.info({fileName: 'OnChain', msg: 'OnChain Withdraw Options: ' + JSON.stringify(options.body)});
  request.post(options).then((body) => {
    logger.info({fileName: 'OnChain', msg: 'OnChain Withdraw Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'OnChain', lineNum: 35, msg: 'OnChain Withdraw Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: 'OnChain Withdraw Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
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
    logger.error({fileName: 'OnChain', lineNum: 51, msg: 'OnChain Withdraw Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'OnChain Withdraw Failed!',
      error: err
    });
  });
}

exports.getUTXOs = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/listFunds';
  request(options).then((body) => {
    if (body.outputs) { body.outputs = common.sortDescByStrKey(body.outputs, 'status'); }
    res.status(200).json(body);
  }).catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.error({fileName: 'OnChain', lineNum: 19, msg: 'OnChain List Funds Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching list funds failed!",
      error: err.error
    });
  });
};

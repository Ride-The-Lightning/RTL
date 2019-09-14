var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getNewAddress = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/newaddr?addrType=' + req.query.type;
  request(options).then((body) => {
    res.status(200).json(body);
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching new address failed!",
      error: err.error
    });
  });
};

exports.onChainWithdraw = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/withdraw';
  options.body = req.body;
  logger.info({fileName: 'OnChain', msg: 'OnChain Withdraw Options: ' + JSON.stringify(options)});
  request.post(options).then((body) => {
    logger.info({fileName: 'OnChain', msg: 'OnChain Withdraw Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'OnChain Withdraw Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'OnChain', lineNum: 211, msg: 'OnChain Withdraw Response: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'OnChain Withdraw Failed!',
      error: err.error
    });
  });
}

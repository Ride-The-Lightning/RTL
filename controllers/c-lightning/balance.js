var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getBalance';
  request(options).then((body) => {
    logger.info({fileName: 'Balance', msg: 'Balance Received: ' + JSON.stringify(body)});
    if(!body.totalBalance) {
      body.totalBalance = 0;
      body.btc_totalBalance = 0;
    } else {
      body.btc_totalBalance = common.convertToBTC(body.totalBalance);
    }
    if(!body.confBalance) {
      body.confBalance = 0;
      body.btc_confBalance = 0;
    } else {
      body.btc_confBalance = common.convertToBTC(body.confBalance);
    }
    if(!body.unconfBalance) {
      body.unconfBalance = 0;
      body.btc_unconfBalance = 0;
    } else {
      body.btc_unconfBalance = common.convertToBTC(body.unconfBalance);
    }
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
    logger.error({fileName: 'Balance', lineNum: 38, msg: 'Balance Fetch Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching balance failed!",
      error: err.error
    });
  });
};

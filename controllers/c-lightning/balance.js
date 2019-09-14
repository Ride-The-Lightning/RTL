var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getBalance';
  request(options).then((body) => {
    logger.info({fileName: 'Balance', msg: ' Balance Received: ' + JSON.stringify(body)});
    if(undefined === body.totalBalance) {
      body.totalBalance = 0;
      body.btc_totalBalance = 0;
    } else {
      body.btc_totalBalance = common.convertToBTC(body.totalBalance);
    }
    if(undefined === body.confBalance) {
      body.confBalance = 0;
      body.btc_confBalance = 0;
    } else {
      body.btc_confBalance = common.convertToBTC(body.confBalance);
    }
    if(undefined === body.unconfBalance) {
      body.unconfBalance = 0;
      body.btc_unconfBalance = 0;
    } else {
      body.btc_unconfBalance = common.convertToBTC(body.unconfBalance);
    }
    
    res.status(200).json(body);
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching balance failed!",
      error: err.error
    });
  });
};

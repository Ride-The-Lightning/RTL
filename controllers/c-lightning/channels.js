var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getLocalRemoteBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channel/localremotebal';
  request(options).then(function (body) {
    logger.info({fileName: 'Channels', msg: 'Local Remote Balance: ' + JSON.stringify(body)});
    if(undefined === body.localBalance) {
      body.localBalance = 0;
      body.btc_localBalance = 0;
    } else {
      body.btc_localBalance = common.convertToBTC(body.localBalance);
    }
    if(undefined === body.remoteBalance) {
      body.remoteBalance = 0;
      body.btc_remoteBalance = 0;
    } else {
      body.btc_remoteBalance = common.convertToBTC(body.remoteBalance);
    }

    res.status(200).json(body);
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 14, msg: 'Local Remote Balance: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Local Remote Balance Failed!',
      error: err.error
    });
  });
};

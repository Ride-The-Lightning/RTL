var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getFees = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getFees';
  request(options).then((body) => {
    logger.info({fileName: 'Fees', msg: 'Fee Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Fees', lineNum: 12, msg: 'Get Fee Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching fee failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      if(!body.feeCollected) {
        body.feeCollected = 0;
        body.btc_feeCollected = 0;
      } else {
        body.btc_feeCollected = common.convertToBTC(body.feeCollected);
      }
      res.status(200).json(body);
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
    logger.error({fileName: 'Fees', lineNum: 34, msg: 'Get Fees Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching fee failed!",
      error: err.error
    });
  });
};

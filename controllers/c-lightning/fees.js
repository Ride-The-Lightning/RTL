var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getFees = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Fees', msg: 'Getting Fees..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getFees';
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Fees', msg: 'Fee Received', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Fees', msg: 'Get Fee Error', error: body.error});
      res.status(500).json({
        message: "Fetching fee failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      if(!body.feeCollected) {
        body.feeCollected = 0;
      }
      logger.log({level: 'INFO', fileName: 'Fees', msg: 'Fees Received'});
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
    logger.log({level: 'ERROR', fileName: 'Fees', msg: 'Get Fees Error', error: err});
    return res.status(500).json({
      message: "Fetching fee failed!",
      error: err.error
    });
  });
};

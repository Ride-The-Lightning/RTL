var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getBalance = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Balance', msg: 'Getting Balance..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getBalance';
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Balance', msg: 'Balance Received', data: body});
    if (!body.totalBalance) {
      body.totalBalance = 0;
    }
    if (!body.confBalance) {
      body.confBalance = 0;
    }
    if (!body.unconfBalance) {
      body.unconfBalance = 0;
    }
    logger.log({level: 'INFO', fileName: 'Balance', msg: 'Balance Received'});
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
    logger.log({level: 'ERROR', fileName: 'Balance', msg: 'Balance Fetch Error', error: err});
    return res.status(500).json({
      message: "Fetching balance failed!",
      error: err.error
    });
  });
};

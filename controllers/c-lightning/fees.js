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
    if (!body.feeCollected) { body.feeCollected = 0; }
    logger.log({level: 'INFO', fileName: 'Fees', msg: 'Fees Received'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Fees', 'Get Fees Error');
    res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

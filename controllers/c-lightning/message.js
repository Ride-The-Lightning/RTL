var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.signMessage = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Message', msg: 'Signing Message..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/utility/signMessage';
  options.form = { message: req.body.message };
  request.post(options).then((body) => {  
    logger.log({level: 'DEBUG', fileName: 'Messages', msg: 'Message Signed', data: body});
    logger.log({level: 'INFO', fileName: 'Message', msg: 'Message Signed'});
    res.status(201).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Message', 'Sign Message Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

exports.verifyMessage = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Message', msg: 'Verifying Message..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/utility/checkMessage/' + req.body.message + '/' + req.body.signature;
  request.get(options, (error, response, body) => {
    logger.log({level: 'DEBUG', fileName: 'Messages', msg: 'Message Verified', data: body});
    logger.log({level: 'INFO', fileName: 'Message', msg: 'Message Verified'});
    res.status(201).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Message', 'Verify Message Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

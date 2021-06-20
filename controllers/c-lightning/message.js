var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.signMessage = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Message', msg: 'Signing Message...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/utility/signMessage';
  options.form = { message: req.body.message };
  request.post(options, (error, response, body) => {
    logger.log({level: 'DEBUG', fileName: 'Messages', msg: 'Message Signed: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Messages', msg: 'Message Sign Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Sign message failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Message', msg: 'Message Signed...'});
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
    logger.log({level: 'ERROR', fileName: 'Messages', msg: 'Sign Message Failed: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Sign Message Failed!',
      error: err.error
    });
  });
};

exports.verifyMessage = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Message', msg: 'Verifying Message...'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/utility/checkMessage/' + req.body.message + '/' + req.body.signature;
  request.get(options, (error, response, body) => {
    logger.log({level: 'DEBUG', fileName: 'Messages', msg: 'Message Verified: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Messages', msg: 'Verify Message Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Verify message failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Message', msg: 'Message Verified.'});
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
    logger.log({level: 'ERROR', fileName: 'Messages', msg: 'Message Verification Failed: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Verify Message Failed!',
      error: err.error
    });
  });
};

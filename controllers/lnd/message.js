var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.signMessage = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/signmessage';
  options.form = JSON.stringify({ 
    msg: Buffer.from(req.body.message).toString('base64')
  });
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Messages', msg: 'Message Signed: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Messages', lineNum: 15, msg: 'Sign Message Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Sign message failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Messages', lineNum: 31, msg: 'Sign Message Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Sign Message Failed!',
      error: err.error
    });
  });
};

exports.verifyMessage = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/verifymessage';
  options.form = JSON.stringify({ 
    msg: Buffer.from(req.body.message).toString('base64'),
    signature: req.body.signature
  });
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Messages', msg: 'Message Verified: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Messages', lineNum: 49, msg: 'Verify Message Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Verify message failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Messages', lineNum: 65, msg: 'Message Verification Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Verify Message Failed!',
      error: err.error
    });
  });
};

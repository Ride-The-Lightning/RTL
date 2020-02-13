var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.signMessage = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/signmessage';
  options.form = JSON.stringify({ 
    msg: Buffer.from(req.body.message).toString('base64')
  });
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Messages', msg: 'Message Signed: ' + JSON.stringify(body)});
    if(!body || body.error) {
      res.status(500).json({
        message: "Sign message failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Messages', lineNum: 24, msg: 'Sign Message Failed: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Sign Message Failed!',
      error: err.error
    });
  });
};

exports.verifyMessage = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/verifymessage';
  options.form = JSON.stringify({ 
    msg: Buffer.from(req.body.message).toString('base64'),
    signature: req.body.signature
  });
  request.post(options, (error, response, body) => {
    logger.info({fileName: 'Messages', msg: 'Message Verified: ' + JSON.stringify(body)});
    if(!body || body.error) {
      res.status(500).json({
        message: "Verify message failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Messages', lineNum: 24, msg: 'Message Verification Failed: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Verify Message Failed!',
      error: err.error
    });
  });
};

var request = require('request');
var options = require("../connect");
var common = require('../common');
var logger = require('./logger');

exports.operateWallet = (req, res, next) => {
  var requestBody = {
    wallet_password: Buffer.from(req.body.wallet_password).toString('base64')
  };
  if (undefined === req.params.operation || req.params.operation === 'unlock') {
    options.url = common.lnd_server_url + '/unlockwallet';
    options.form = JSON.stringify(requestBody);
    err_message = 'Unlocking wallet failed! Verify that lnd is running and the wallet is locked!';
  } else {
    options.url = common.lnd_server_url + '/initwallet';
    options.form = JSON.stringify(requestBody);
    err_message = 'Initializing wallet failed!';
  }
  request.post(options, (error, response, body) => {
    logger.info('\r\nWallet: 20: ' + JSON.stringify(Date.now()) + ': INFO: Unlock Wallet Response: ' + JSON.stringify(body));
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    if(undefined === body) {
      res.status(500).json({
        message: err_message,
        error: err_message
      });
    } else if(search_idx > -1) {
      res.status(500).json({
        message: err_message,
        error: err_message
      });
    } else if(body.error) {
      if((body.code === 1 && body.error === 'context canceled') || (body.code === 14 && body.error === 'transport is closing')) {
        res.status(201).json({wallet: 'successful'});  
      } else {
        res.status(500).json({
          message: err_message,
          error: body.error
        });
      }
    } else {
      res.status(201).json({wallet: 'successful'});
    }
  });
};

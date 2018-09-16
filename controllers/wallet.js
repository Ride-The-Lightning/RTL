var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.operateWallet = (req, res, next) => {
  console.log('\nRequest Body before conversion: ');
  console.log(req.body);
  var requestBody =  {
    wallet_password: Buffer.from(req.body.wallet_password).toString('base64')
  };
  console.log('\nRequest Body after conversion into Uint8Array: ');
  console.log(requestBody);
  if (undefined === req.params.operation || req.params.operation === 'unlock') {
    options.url = config.lnd_server_url + '/unlockwallet';
    options.form = JSON.stringify(requestBody);
    err_message = 'Unlocking wallet failed! Verify that lnd is running!';
  } else {
    options.url = config.lnd_server_url + '/initwallet';
    options.form = JSON.stringify(requestBody);
    err_message = 'Initializing wallet failed!';
  }
  options.qs = req.query;
  console.log('\nForm: ' + options.form);
  request.post(options, (error, response, body) => {
    console.log('\nUnlock Wallet Response: ');
    console.log(body);
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    if(undefined === body) {
      res.status(500).json({
        message: err_message,
        error: 'Unlocking wallet failed! Verify that lnd is running!'
      });
    } else if(search_idx > -1) {
      res.status(500).json({
        message: err_message,
        error: 'Unlocking wallet failed! Verify that lnd is running!'
      });
    } else if(body.error) {
      if(body.code === 1 && body.error === 'context canceled') {
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

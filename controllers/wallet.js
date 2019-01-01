var request = require('request-promise');
var options = require("../connect");
var common = require('../common');

exports.operateWallet = (req, res, next) => {
  var requestBody =  {
    wallet_password: Buffer.from(req.body.wallet_password).toString('base64')
  };
  if (undefined === req.params.operation || req.params.operation === 'unlock') {
    options.url = common.lnd_server_url + '/unlockwallet';
    options.form = JSON.stringify(requestBody);
    err_message = 'Unlocking wallet failed! Verify that lnd is running!';
  } else {
    options.url = common.lnd_server_url + '/initwallet';
    options.form = JSON.stringify(requestBody);
    err_message = 'Initializing wallet failed!';
  }
  options.qs = req.query;
  request.post(options).then((body) => {
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
  })
  .catch(function (err) {
    if((err.error.code === 1 && err.error.error === 'context canceled') || (err.error.code === 14 && err.error.error === 'transport is closing')) {
      res.status(201).json({wallet: 'successful'});  
    } else {
      res.status(500).json({
        message: err_message,
        error: err.error.error
      });
    }
  });
};

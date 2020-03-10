var request = require('request-promise');
var common = require('../../common');
var atob = require('atob');
var logger = require('../logger');
var options = {};

exports.genSeed = (req, res, next) => {
  options = common.getOptions();
  if ( req.params.passphrase) {
    options.url = common.getSelLNServerUrl() + '/genseed?aezeed_passphrase=' + Buffer.from(atob(req.params.passphrase)).toString('base64');
  } else {
    options.url = common.getSelLNServerUrl() + '/genseed';
  }
  request(options).then((body) => {
    if(!body || body.error) {
      res.status(500).json({
        message: "Genseed failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Genseed failed!",
      error: err.error
    });
  });
}

exports.operateWallet = (req, res, next) => {
  options = common.getOptions();
  options.method = 'POST';
  if (!req.params.operation || req.params.operation === 'unlockwallet') {
    options.url = common.getSelLNServerUrl() + '/unlockwallet';
    options.form = JSON.stringify({
      wallet_password: Buffer.from(atob(req.body.wallet_password)).toString('base64')
    });
    err_message = 'Unlocking wallet failed! Verify that lnd is running and the wallet is locked!';
  } else {
    options.url = common.getSelLNServerUrl() + '/initwallet';
    if ( req.body.aezeed_passphrase && req.body.aezeed_passphrase !== '') {
      options.form = JSON.stringify({
        wallet_password: Buffer.from(atob(req.body.wallet_password)).toString('base64'),
        cipher_seed_mnemonic: req.body.cipher_seed_mnemonic,
        aezeed_passphrase: Buffer.from(atob(req.body.aezeed_passphrase)).toString('base64')
      });
    } else {
      options.form = JSON.stringify({
        wallet_password: Buffer.from(atob(req.body.wallet_password)).toString('base64'),
        cipher_seed_mnemonic: req.body.cipher_seed_mnemonic
      });
    }
    err_message = 'Initializing wallet failed!';
  }
  request(options).then((body) => {
    logger.info({fileName: 'Wallet', msg: 'Wallet Response: ' + JSON.stringify(body)});
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    if(!body) {
      res.status(500).json({
        message: err_message,
        error: (error) ? error : err_message
      });
    } else if(search_idx > -1) {
      res.status(500).json({
        message: err_message,
        error: err_message
      });
    } else if(body.error) {
      if((body.code === 1 && body.error === 'context canceled') || (body.code === 14 && body.error === 'transport is closing')) {
        res.status(201).json('Successful');  
      } else {
        res.status(500).json({
          message: err_message,
          error: body.error
        });
      }
    } else {
      res.status(201).json('Successful');
    }
  }).catch(error => {
    logger.error({fileName: 'Wallet', lineNum: 83, msg: 'Wallet Response: ' + JSON.stringify(error.error)});
    if((error.error.code === 1 && error.error.error === 'context canceled') || (error.error.code === 14 && error.error.error === 'transport is closing')) {
      res.status(201).json('Successful');  
    } else {
      res.status(500).json({
        message: err_message,
        error: error.error.message ? error.error.message : error.message
      });
    }
  });
};

exports.updateSelNodeOptions = (req, res, next) => {
    let response = common.updateSelectedNodeOptions();
    res.status(response.status).json({updateMessage: response.message});
}

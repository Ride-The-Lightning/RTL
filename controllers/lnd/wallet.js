var request = require('request-promise');
var common = require('../../common');
var atob = require('atob');
var logger = require('../logger');
var options = {};

exports.genSeed = (req, res, next) => {
  options = common.getOptions();
  if ( req.params.passphrase) {
    options.url = common.getSelLNServerUrl() + '/v1/genseed?aezeed_passphrase=' + Buffer.from(atob(req.params.passphrase)).toString('base64');
  } else {
    options.url = common.getSelLNServerUrl() + '/v1/genseed';
  }
  request(options).then((body) => {
    if(!body || body.error) {
      logger.error({fileName: 'Wallet', lineNum: 16, msg: 'Gen Seed Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Genseed failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
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
    logger.error({fileName: 'Wallet', lineNum: 32, msg: 'Gen Seed Error: ' + JSON.stringify(err)});
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
    options.url = common.getSelLNServerUrl() + '/v1/unlockwallet';
    options.form = JSON.stringify({
      wallet_password: Buffer.from(atob(req.body.wallet_password)).toString('base64')
    });
    err_message = 'Unlocking wallet failed! Verify that lnd is running and the wallet is locked!';
  } else {
    options.url = common.getSelLNServerUrl() + '/v1/initwallet';
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
      logger.error({fileName: 'Wallet', lineNum: 70, msg: 'Wallet Error: ' + ((error) ? JSON.stringify(error) : err_message)});
      res.status(500).json({
        message: err_message,
        error: (error) ? error : err_message
      });
    } else if(search_idx > -1) {
      logger.error({fileName: 'Wallet', lineNum: 76, msg: 'Wallet Error: ' + err_message});
      res.status(500).json({
        message: err_message,
        error: err_message
      });
    } else if(body.error) {
      if((body.code === 1 && body.error === 'context canceled') || (body.code === 14 && body.error === 'transport is closing')) {
        res.status(201).json('Successful');  
      } else {
        logger.error({fileName: 'Wallet', lineNum: 85, msg: 'Wallet Error: ' + JSON.stringify(body.error)});
        res.status(500).json({
          message: err_message,
          error: body.error
        });
      }
    } else {
      res.status(201).json('Successful');
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
    logger.error({fileName: 'Wallet', lineNum: 101, msg: 'Wallet Error: ' + JSON.stringify(err)});
    if((err.error.code === 1 && err.error.error === 'context canceled') || (err.error.code === 14 && err.error.error === 'transport is closing')) {
      res.status(201).json('Successful');  
    } else {
      res.status(500).json({
        message: err_message,
        error: err.error.message ? err.error.message : err.message ? err.message : err_message
      });
    }
  });
};

exports.updateSelNodeOptions = (req, res, next) => {
  let response = common.updateSelectedNodeOptions();
  res.status(response.status).json({updateMessage: response.message});
}

exports.getUTXOs = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v2/wallet/utxos';
  request.post(options).then((body) => {
    res.status(200).json(body.utxos ? body.utxos : []);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Wallet', lineNum: 143, msg: 'UTXOs Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "UTXO list failed!",
      error: err.error
    });
  });
}

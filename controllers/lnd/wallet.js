var request = require('request-promise');
var common = require('../../routes/common');
var atob = require('atob');
var logger = require('../shared/logger');
var options = {};

exports.genSeed = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Generating Seed..'});
  options = common.getOptions();
  if ( req.params.passphrase) {
    options.url = common.getSelLNServerUrl() + '/v1/genseed?aezeed_passphrase=' + Buffer.from(atob(req.params.passphrase)).toString('base64');
  } else {
    options.url = common.getSelLNServerUrl() + '/v1/genseed';
  }
  request(options).then((body) => {
    if (!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Gen Seed Error', error: body.error});
      res.status(500).json({
        message: "Genseed failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Seed Generated'});
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
    logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Gen Seed Error', error: err});
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
    logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Unlocking Wallet..'});
    options.url = common.getSelLNServerUrl() + '/v1/unlockwallet';
    options.form = JSON.stringify({
      wallet_password: Buffer.from(atob(req.body.wallet_password)).toString('base64')
    });
    err_message = 'Unlocking wallet failed! Verify that lnd is running and the wallet is locked!';
  } else {
    logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Initializing Wallet..'});
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
    logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'Wallet Response', data: body});
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    if (!body) {
      logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Wallet Error', error: {error: (error ? error : err_message)}});
      res.status(500).json({
        message: err_message,
        error: (error) ? error : err_message
      });
    } else if (search_idx > -1) {
      logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Wallet Error', error: {error: err_message}});
      res.status(500).json({
        message: err_message,
        error: err_message
      });
    } else if (body.error) {
      if ((body.code === 1 && body.error === 'context canceled') || (body.code === 14 && body.error === 'transport is closing')) {
        res.status(201).json('Successful');  
      } else {
        logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Wallet Error', error: body.error});
        res.status(500).json({
          message: err_message,
          error: body.error
        });
      }
    } else {
      logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Wallet Unlocked/Initialized'});
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
    logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Wallet Error', error: err});
    if ((err.error.code === 1 && err.error.error === 'context canceled') || (err.error.code === 14 && err.error.error === 'transport is closing')) {
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
  logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Getting UTXOs..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v2/wallet/utxos?max_confs=' + req.query.max_confs;
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'UTXO List Response', data: body});
    logger.log({level: 'INFO', fileName: 'Wallet', msg: 'UTXOs Received'});
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
    logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'UTXOs Error', error: err});
    return res.status(500).json({
      message: "UTXO list failed!",
      error: err.error
    });
  });
}

exports.bumpFee = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Bumping Fee..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v2/wallet/bumpfee';
  options.form = {};
  options.form.outpoint = {
    txid_str: req.body.txid,
    output_index: req.body.outputIndex
  };
  if (req.body.targetConf) {
    options.form.target_conf = req.body.targetConf;
  } else if (req.body.satPerByte) {
    options.form.sat_per_byte = req.body.satPerByte;
  }
  options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'Bump Fee Response', data: body});
    logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Fee Bumped'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Bump Fee Error', error: err});
    return res.status(500).json({
      message: "Bump fee failed!",
      error: err.error
    });
  });
}

exports.labelTransaction = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Labelling Transaction..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v2/wallet/tx/label';
  options.form = {};
  options.form.txid = req.body.txid;
  options.form.label = req.body.label;
  options.form.overwrite = req.body.overwrite;
  options.form = JSON.stringify(options.form);
  logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'Label Transaction Options', data: options.form});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'Label Transaction Post Response', data: body});
    logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Transaction Labelled'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Label Transaction Error', error: err});
    return res.status(500).json({
      message: "Transaction label failed!",
      error: err.error
    });
  });
}

exports.leaseUTXO = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Leasing UTXO..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v2/wallet/utxos/lease';
  options.form = {};
  options.form.id = req.body.txid;
  options.form.outpoint = {
    txid_bytes: req.body.txid,
    output_index: req.body.outputIndex
  };
  options.form = JSON.stringify(options.form);
  logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'UTXO Lease Options', data: options.form});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'UTXO Lease Response', data: body});
    logger.log({level: 'INFO', fileName: 'Wallet', msg: 'UTXO Leased'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Lease UTXO Error', error: err});
    return res.status(500).json({
      message: "Lease UTXO failed!",
      error: err.error
    });
  });
}

exports.releaseUTXO = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Wallet', msg: 'Releasing UTXO..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v2/wallet/utxos/release';
  options.form = {};
  options.form.id = req.body.txid;
  options.form.outpoint = {
    txid_bytes: req.body.txid,
    output_index: req.body.outputIndex
  };
  options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Wallet', msg: 'UTXO Release Response', data: body});
    logger.log({level: 'INFO', fileName: 'Wallet', msg: 'UTXO Released'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.log({level: 'ERROR', fileName: 'Wallet', msg: 'Release UTXO Error', error: err});
    return res.status(500).json({
      message: "Release UTXO failed!",
      error: err.error
    });
  });
}

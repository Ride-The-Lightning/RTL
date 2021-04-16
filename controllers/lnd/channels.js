var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

getAliasForChannel = (channel) => {
  return new Promise(function(resolve, reject) {
    let pubkey = (channel.remote_pubkey) ? channel.remote_pubkey : (channel.remote_node_pub) ? channel.remote_node_pub : '';
    options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + pubkey;
    request(options).then(function(aliasBody) {
      logger.info({fileName: 'Channels', msg: 'Alias: ' + JSON.stringify(aliasBody.node.alias)});
      channel.remote_alias = aliasBody.node.alias;
      resolve(aliasBody.node.alias);
    })
    .catch(err => {
      channel.remote_alias = pubkey.slice(0, 10) + '...' + pubkey.slice(-10);
      resolve(pubkey);  
    });
  });
}

exports.getAllChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels';
  options.qs = req.query;
  let local = 0;
  let remote = 0;
  let total = 0;
  request(options).then(function (body) {
    logger.info({fileName: 'Channels', msg: 'All Channels Received: ' + JSON.stringify(body)});
    if(body.channels) {
      Promise.all(
        body.channels.map(channel => {
          local = (channel.local_balance) ? +channel.local_balance : 0;
          remote = (channel.remote_balance) ? +channel.remote_balance : 0;
          total = local + remote;
          channel.balancedness = (total == 0) ? 1 : (1 - Math.abs((local-remote)/total)).toFixed(3);
          return getAliasForChannel(channel);
        })
      )
      .then(function(values) {
        body.channels = common.sortDescByKey(body.channels, 'balancedness');
        logger.info({fileName: 'Channels', msg: 'All Channels with Alias: ' + JSON.stringify(body)});
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
        logger.error({fileName: 'Channels', lineNum: 48, msg: 'Get All Channel Alias Error: ' + JSON.stringify(err)});
        res.status(500).json({
          message: 'Fetching Channels Alias Failed!',
          error: err.error
        });
      });
    } else {
      body.channels = [];
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
    logger.error({fileName: 'Channels', lineNum: 66, msg: 'Get All Channels Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching All Channels Failed!',
      error: err.error
    });
  });
};

exports.getPendingChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels/pending';
  options.qs = req.query;
  request(options).then(function (body) {
    if (!body.total_limbo_balance) {
      body.total_limbo_balance = 0;
      body.btc_total_limbo_balance = 0;
    } else {
      body.btc_total_limbo_balance = common.convertToBTC(body.total_limbo_balance);
    }
    const promises = [];
    if(body.pending_open_channels && body.pending_open_channels.length > 0) {
      body.pending_open_channels.map(channel => { return promises.push(getAliasForChannel(channel.channel))});
    }
    if(body.pending_closing_channels && body.pending_closing_channels.length > 0) {
      body.pending_closing_channels.map(channel => { return promises.push(getAliasForChannel(channel.channel))});
    }
    if(body.pending_force_closing_channels && body.pending_force_closing_channels.length > 0) {
      body.pending_force_closing_channels.map(channel => { return promises.push(getAliasForChannel(channel.channel))});
    }
    if(body.waiting_close_channels && body.waiting_close_channels.length > 0) {
      body.waiting_close_channels.map(channel => { return promises.push(getAliasForChannel(channel.channel))});
    }
    Promise.all(promises).then(function(values) {
      logger.info({fileName: 'Channels', msg: 'Pending Channels: ' + JSON.stringify(body)});
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
      logger.error({fileName: 'Channels', lineNum: 106, msg: 'Get Pending Channel Alias Error: ' + JSON.stringify(err)});
      res.status(500).json({
        message: 'Fetching Pending Channels Failed!',
        error: err.error
      });
    });      
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Channels', lineNum: 97, msg: 'Get Pending Channel Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Pending Channels Failed!',
      error: err.error
    });
  });
};

exports.getClosedChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels/closed';
  options.qs = req.query;
  request(options).then(function (body) {
    if (body.channels && body.channels.length > 0) {
      Promise.all(
        body.channels.map(channel => {
          channel.close_type = (!channel.close_type) ? 'COOPERATIVE_CLOSE' : channel.close_type;
          return getAliasForChannel(channel);
        })
      )
      .then(function(values) {
        body.channels = common.sortDescByKey(body.channels, 'close_height');
        logger.info({fileName: 'Channels', msg: 'Closed Channels: ' + JSON.stringify(body)});
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
        logger.error({fileName: 'Channels', lineNum: 48, msg: 'Get All Channel Alias Error: ' + JSON.stringify(err)});
        res.status(500).json({
          message: 'Fetching Channels Alias Failed!',
          error: err.error
        });
      });
    } else {
      body.channels = [];
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
    logger.error({fileName: 'Channels', lineNum: 126, msg: 'Get Closed Channel Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Closed Channels Failed!',
      error: err.error
    });
  });
};

exports.postChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels';
  options.form = { 
    node_pubkey_string: req.body.node_pubkey,
    local_funding_amount: req.body.local_funding_amount,
    private: req.body.private,
    spend_unconfirmed: req.body.spend_unconfirmed
  };
  if (req.body.trans_type === '1') {
    options.form.target_conf = req.body.trans_type_value;
  } else if (req.body.trans_type === '2') {
    options.form.sat_per_byte = req.body.trans_type_value;
  }
  options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Channel Open Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Channels', lineNum: 152, msg: 'Open New Channel  Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: 'Open Channel Failed!',
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
    logger.error({fileName: 'Channels', lineNum: 168, msg: 'Open New Channel Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Open Channel Failed!',
      error: err.error
    });
  });
};

exports.postTransactions = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channels/transactions';
  options.form = { payment_request: req.body.paymentReq };
  if(req.body.paymentAmount) {
    options.form.amt = req.body.paymentAmount;
  }
  if (req.body.feeLimit) { options.form.fee_limit = req.body.feeLimit; }
  if (req.body.outgoingChannel) { options.form.outgoing_chan_id = req.body.outgoingChannel; }
  if (req.body.allowSelfPayment) { options.form.allow_self_payment = req.body.allowSelfPayment; }
  if (req.body.lastHopPubkey) { options.form.last_hop_pubkey = Buffer.from(req.body.lastHopPubkey, 'hex').toString('base64'); }
  options.form = JSON.stringify(options.form);
  logger.info({fileName: 'Channels', msg: 'Send Payment Options: ' + options.form});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Send Payment Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Channels', lineNum: 200, msg: 'Send Payment  Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: 'Send Payment Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else if (body.payment_error) {
      logger.error({fileName: 'Channels', lineNum: 206, msg: 'Send Payment Error: ' + JSON.stringify(body.payment_error)});
      res.status(500).json({
        message: 'Send Payment Failed!',
        error: (!body) ? 'Error From Server!' : body.payment_error
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
    logger.error({fileName: 'Channels', lineNum: 222, msg: 'Send Payment Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Send Payment Failed!',
      error: err.error
    });
  });
};

exports.closeChannel = (req, res, next) => {
  req.setTimeout(60000 * 10); // timeout 10 mins
  options = common.getOptions();
  let channelpoint = req.params.channelPoint.replace(':', '/');
  options.url = common.getSelLNServerUrl() + '/v1/channels/' + channelpoint + '?force=' + req.query.force;
  if(req.query.target_conf) { options.url = options.url + '&target_conf=' + req.query.target_conf; }
  if(req.query.sat_per_byte) { options.url = options.url + '&sat_per_byte=' + req.query.sat_per_byte; }
  logger.info({fileName: 'Channels', msg: 'Closing Channel: ' + options.url});
  request.delete(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Close Channel Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Channels', lineNum: 241, msg: 'Close Channel  Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: 'Close Channel Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(204).json({message: 'Channel Closed!'});
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
    logger.error({fileName: 'Channels', lineNum: 257, msg: 'Close Channel Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Close Channel Failed!',
      error: err.error
    });
  });
}

exports.postChanPolicy = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/chanpolicy';
  if(req.body.chanPoint === 'all') {
    options.form = JSON.stringify({
      global: true, 
      base_fee_msat: req.body.baseFeeMsat,
      fee_rate: parseFloat(req.body.feeRate/1000000),
      time_lock_delta: parseInt(req.body.timeLockDelta)
    });
  } else {
    let breakPoint = req.body.chanPoint.indexOf(':');
    let txid_str = req.body.chanPoint.substring(0, breakPoint);
    let output_idx = req.body.chanPoint.substring(breakPoint+1, req.body.chanPoint.length);
    options.form = JSON.stringify({ 
      base_fee_msat: req.body.baseFeeMsat,
      fee_rate: parseFloat(req.body.feeRate/1000000),
      time_lock_delta: parseInt(req.body.timeLockDelta),
      chan_point: {funding_txid_str: txid_str, output_index: parseInt(output_idx)}
    });
  }
  logger.info({fileName: 'Channels', msg: 'Update Channel Policy Options: ' + JSON.stringify(options.form)});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Update Channel Policy: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Channels', lineNum: 290, msg: 'Update Channel Policy Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: 'Update Channel Failed!',
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
    logger.error({fileName: 'Channels', lineNum: 306, msg: 'Update Channel Policy Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Update Channel Failed!',
      error: err.error
    });
  });
};

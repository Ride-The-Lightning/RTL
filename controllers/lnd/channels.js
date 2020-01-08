var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

getAliasForChannel = (channel) => {
  return new Promise(function(resolve, reject) {
    options.url = common.getSelLNServerUrl() + '/graph/node/' + channel.remote_pubkey;
    request(options).then(function(aliasBody) {
      logger.info({fileName: 'Channels', msg: 'Alias: ' + JSON.stringify(aliasBody.node.alias)});
      channel.remote_alias = aliasBody.node.alias;
      resolve(aliasBody.node.alias);
    })
    .catch(err => resolve(''));
  });
}

exports.getAllChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels';
  options.qs = req.query;
  let local = 0;
  let remote = 0;
  let total = 0;
  request(options).then(function (body) {
    if(body.channels) {
      Promise.all(
        body.channels.map(channel => {
          local = (channel.local_balance) ? +channel.local_balance : 0;
          remote = (channel.remote_balance) ? +channel.remote_balance : 0;
          total = local + remote;
          channel.balancedness = (total === 0) ? 1 : (1 - Math.abs((local-remote)/total)).toFixed(3);
          return getAliasForChannel(channel);
        })
      )
      .then(function(values) {
        body.channels = common.sortDescByKey(body.channels, 'balancedness');
        logger.info({fileName: 'Channels', msg: 'All Channels with Alias: ' + JSON.stringify(body)});
        res.status(200).json(body);
      }).catch(err => {
        logger.error({fileName: 'Channels', lineNum: 49, msg: 'Get All Channel Alias: ' + JSON.stringify(err)});
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
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 68, msg: 'Get All Channel: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching All Channels Failed!',
      error: err.error
    });
  });
};

exports.getPendingChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels/pending';
  options.qs = req.query;
  request(options).then(function (body) {
    let channels = [];
    if (undefined === body.total_limbo_balance) {
      body.total_limbo_balance = 0;
      body.btc_total_limbo_balance = 0;
    } else {
      body.btc_total_limbo_balance = common.convertToBTC(body.total_limbo_balance);
    }
    logger.info({fileName: 'Channels', msg: 'Pending Channels: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 68, msg: 'Get Pending Channel: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Pending Channels Failed!',
      error: err.error
    });
  });
};

exports.getClosedChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels/closed';
  options.qs = req.query;
  request(options).then(function (body) {
    let channels = [];
    if (body.channels && body.channels.length > 0) {
      body.channels.forEach(channel => {
        channel.close_type = (undefined === channel.close_type) ? 'COOPERATIVE_CLOSE' : channel.close_type;
      });
      body.channels = common.sortDescByKey(body.channels, 'close_type');
    }
    logger.info({fileName: 'Channels', msg: 'Closed Channels: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 68, msg: 'Get Closed Channel: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Closed Channels Failed!',
      error: err.error
    });
  });
};

exports.postChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels';
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
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'Open Channel Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 103, msg: 'Open Channel: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Open Channel Failed!',
      error: err.error
    });
  });
};

exports.postTransactions = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels/transactions';
  if(req.body.paymentReq) {
    options.form = { 
      payment_request: req.body.paymentReq
    };
  } else if(req.body.paymentDecoded) {
    options.form = { 
      payment_hash_string: req.body.paymentDecoded.payment_hash,
      final_cltv_delta: parseInt(req.body.paymentDecoded.cltv_expiry),
      amt: req.body.paymentDecoded.num_satoshis,
      dest_string: req.body.paymentDecoded.destination
    };
  }
  if(req.body.feeLimit) {
    options.form.fee_limit = req.body.feeLimit;
  }
  if(req.body.outgoingChannel) {
    options.form.outgoing_chan_id = req.body.outgoingChannel;
  }
  options.form = JSON.stringify(options.form);
  logger.info({fileName: 'Channels', msg: 'Send Payment Options: ' + options.form});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Send Payment Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'Send Payment Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else if (body.payment_error) {
      res.status(500).json({
        message: 'Send Payment Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.payment_error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 143, msg: 'Send Payment: ' + JSON.stringify(err)});
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
  options.url = common.getSelLNServerUrl() + '/channels/' + channelpoint + '?force=' + req.query.force;
  logger.info({fileName: 'Channels', msg: 'Closing Channel: ' + options.url});
  request.delete(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Close Channel Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'Close Channel Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(204).json({message: 'Channel Closed!'});
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 169, msg: 'Close Channel: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Close Channel Failed!',
      error: err.error
    });
  });
}

exports.postChanPolicy = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/chanpolicy';
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
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'Update Channel Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 211, msg: 'Update Channel Policy: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Update Channel Failed!',
      error: err.error
    });
  });
};

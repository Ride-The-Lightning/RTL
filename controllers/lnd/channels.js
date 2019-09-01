var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

getAliasForChannel = (channel, channelType) => {
  return new Promise(function(resolve, reject) {
    if (undefined === channelType || channelType === 'all') {
      options.url = common.getSelLNDServerUrl() + '/graph/node/' + channel.remote_pubkey;
    } else {
      options.url = common.getSelLNDServerUrl() + '/graph/node/' + channel.channel.remote_node_pub;
    }
    request(options).then(function(aliasBody) {
      logger.info({fileName: 'Channels', msg: 'Alias: ' + JSON.stringify(aliasBody.node.alias)});
      if (undefined === channelType || channelType === 'all') {
        channel.remote_alias = aliasBody.node.alias;
        resolve(aliasBody.node.alias);
      } else {
        channel.channel.remote_alias = aliasBody.node.alias;
        resolve(aliasBody.node.alias);
      }
    })
    .catch(err => resolve(''));
  });
}

exports.getChannels = (req, res, next) => {
  options = common.getOptions();
  if (undefined === req.params.channelType || req.params.channelType === 'all') {
    options.url = common.getSelLNDServerUrl() + '/channels';
  } else {
    options.url = common.getSelLNDServerUrl() + '/channels/' + req.params.channelType; // active_only, inactive_only, public_only, private_only, Not Implemented in Frontend yet
  }
  options.qs = req.query;
  request(options).then(function (body) {
    let channels = [];
    if (undefined === req.params.channelType || req.params.channelType === 'all') {
      channels = (undefined === body.channels) ? [] : body.channels;
      Promise.all(
        channels.map(channel => {
          return getAliasForChannel(channel, req.params.channelType);
        })
      )
      .then(function(values) {
        logger.info({fileName: 'Channels', msg: 'Channels with Alias: ' + JSON.stringify(body)});
        res.status(200).json(body);
      }).catch(err => {
        console.error(err.error);
      });
    } else {
      if (undefined === body.total_limbo_balance) {
        body.total_limbo_balance = 0;
        body.btc_total_limbo_balance = 0;
      } else {
        body.btc_total_limbo_balance = common.convertToBTC(body.total_limbo_balance);
      }
      if (req.params.channelType === 'closed') {
        body.channels.forEach(channel => {
          channel.close_type = (undefined === channel.close_type) ? 'COOPERATIVE_CLOSE' : channel.close_type;
        });
        body.channels = common.sortDescByKey(body.channels, 'close_type');
      }
      logger.info({fileName: 'Channels', msg: 'Pending/Closed Channels: ' + JSON.stringify(body)});
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 68, msg: 'Get Channel: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Channels Failed!',
      error: err.error
    });
  });
};

exports.postChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/channels';
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
  options.url = common.getSelLNDServerUrl() + '/channels/transactions';
  if(req.body.paymentReq) {
    options.form = JSON.stringify({ 
      payment_request: req.body.paymentReq
    });
  } else if(req.body.paymentDecoded) {
    options.form = JSON.stringify({ 
      payment_hash_string: req.body.paymentDecoded.payment_hash,
      final_cltv_delta: parseInt(req.body.paymentDecoded.cltv_expiry),
      amt: req.body.paymentDecoded.num_satoshis,
      dest_string: req.body.paymentDecoded.destination
    });
  }
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
  options.url = common.getSelLNDServerUrl() + '/channels/' + channelpoint + '?force=' + req.query.force;
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
  options.url = common.getSelLNDServerUrl() + '/chanpolicy';
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
  logger.info({fileName: 'Channels', msg: 'Update Channel Policy Options: ' + JSON.stringify(options)});
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

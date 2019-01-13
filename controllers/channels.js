var request = require('request-promise');
var options = require('../connect');
var common = require('../common');
var logger = require('./logger');

getAliasForChannel = (channel, channelType) => {
  return new Promise(function(resolve, reject) {
    if (undefined === channelType || channelType === 'all') {
      options.url = common.lnd_server_url + '/graph/node/' + channel.remote_pubkey;
    } else {
      options.url = common.lnd_server_url + '/graph/node/' + channel.channel.remote_node_pub;
    }
    request(options).then(function(aliasBody) {
      logger.info('\r\nChannels: 13: ' + JSON.stringify(Date.now()) + ': INFO: Alias: ' + JSON.stringify(aliasBody.node.alias));
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
  if (undefined === req.params.channelType || req.params.channelType === 'all') {
    options.url = common.lnd_server_url + '/channels';
  } else {
    options.url = common.lnd_server_url + '/channels/' + req.params.channelType;
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
        logger.info('\r\nChannels: 43: ' + JSON.stringify(Date.now()) + ': INFO: Channels with Alias: ' + JSON.stringify(body));
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
      logger.info('\r\nChannels: 55: ' + JSON.stringify(Date.now()) + ': INFO: Pending Channels: ' + JSON.stringify(body));
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: 'Fetching Channels Failed!',
      error: err.error
    });
  });
};

exports.postChannel = (req, res, next) => {
  options.url = common.lnd_server_url + '/channels';
  options.form = JSON.stringify({ 
    node_pubkey_string: req.body.node_pubkey,
    local_funding_amount: req.body.local_funding_amount
  });
  request.post(options).then((body) => {
    logger.info('\r\nChannels: 74: ' + JSON.stringify(Date.now()) + ': INFO: Channel Open Response: ' + JSON.stringify(body));
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
    return res.status(500).json({
      message: 'Open Channel Failed!',
      error: err.error
    });
  });
};

exports.postTransactions = (req, res, next) => {
  options.url = common.lnd_server_url + '/channels/transactions';
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
    logger.info('\r\nChannels: 107: ' + JSON.stringify(Date.now()) + ': INFO: Send Payment Response: ' + JSON.stringify(body));
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
    return res.status(500).json({
      message: 'Send Payment Failed!',
      error: err.error
    });
  });
};

exports.closeChannel = (req, res, next) => {
  let channelpoint = req.params.channelPoint.replace(':', '/');
  options.url = common.lnd_server_url + '/channels/' + channelpoint + '?force=' + req.query.force;
  request.delete(options).then((body) => {
    logger.info('\r\nChannels: 134: ' + JSON.stringify(Date.now()) + ': INFO: Close Channel Response: ' + JSON.stringify(body));
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
    return res.status(500).json({
      message: 'Close Channel Failed!',
      error: err.error
    });
  });
}
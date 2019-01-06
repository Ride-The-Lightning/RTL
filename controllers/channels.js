var request = require("request-promise");
var options = require("../connect");
var common = require('../common');

getAliasForChannel = (channel, channelType) => {
  console.log('CHANNEL: ');
  console.log(channel);
  return new Promise(function(resolve, reject) {
    if (undefined === channelType || channelType === 'all') {
      options.url = common.lnd_server_url + '/graph/node/' + channel.remote_pubkey;
    } else {
      options.url = common.lnd_server_url + '/graph/node/' + channel.channel.remote_node_pub;
    }
    console.log('URL: ' + options.url);
    request(options).then(function(aliasBody) {
      console.log('Alias: ' + JSON.stringify(aliasBody.node.alias));
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
        console.log(`\nChannels Fetched with Alias: ${JSON.stringify(body)}`);
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
      console.log(`\nPending Channels Fetched: ${JSON.stringify(body)}`);
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching channels failed!",
      error: err.error
    });
  });
};

exports.postChannel = (req, res, next) => {
  // setTimeout(()=>{res.status(201).json({message: 'Channel Open!'});}, 5000);
  options.url = common.lnd_server_url + '/channels';
  options.form = JSON.stringify({ 
    node_pubkey_string: req.body.node_pubkey,
    local_funding_amount: req.body.local_funding_amount
  });
  request.post(options).then((body) => {
    console.log('Channel Open Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Open Channel Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Open Channel failed!",
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
  console.log('Send Payment Options Form:' + options.form);
  request.post(options).then((body) => {
    console.log('Send Payment Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Send Payment Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else if (body.payment_error) {
      res.status(500).json({
        message: "Send Payment Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.payment_error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Send Payment Failed!",
      error: err.error
    });
  });
};

exports.closeChannel = (req, res, next) => {
  let channelpoint = req.params.channelPoint.replace(":", "/");
  options.url = common.lnd_server_url + '/channels/' + channelpoint + '?force=' + req.query.force;
  console.log('\nClosing Channel URL: ');
  console.log(options.url);
  request.delete(options).then((body) => {
    console.log('\nClose Channel Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Close Channel Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(204).json({message: 'Channel Closed!'});
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Close Channel failed!",
      error: err.error
    });
  });
}
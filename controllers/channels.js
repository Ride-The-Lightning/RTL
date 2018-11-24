var request = require("request-promise");
var options = require("../connect");
var common = require('../common');

getAlias = (channel, channelType) => {
  // console.log('CHANNEL: ');
  // console.log(channel);
  return new Promise(function(resolve, reject) {
    if (undefined === channelType || channelType === 'all') {
      options.url = common.lnd_server_url + '/graph/node/' + channel.remote_pubkey;
    } else {
      options.url = common.lnd_server_url + '/graph/node/' + channel.channel.remote_node_pub;
    }
    console.log('URL: ' + options.url);
    request(options)
    .then(function(aliasBody) {
      console.log('Alias: ' + JSON.stringify(aliasBody.node.alias));
      if (undefined === channelType || channelType === 'all') {
        channel.remote_alias = aliasBody.node.alias;
        resolve(aliasBody.node.alias);
      } else {
        channel.channel.remote_alias = aliasBody.node.alias;
        resolve(aliasBody.node.alias);
      }
    })
    .catch(err => reject(err));
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
    } else {
      channels = (undefined === body.pending_open_channels) ? [] : body.pending_open_channels;
    }
    Promise.all(
      channels.map(channel => {
        return getAlias(channel, req.params.channelType);
      }))
    .then(function(values) {
      console.log(`\nChannels Fetched with Alias: ${JSON.stringify(body)}`);
      res.status(200).json(body);
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
  request.post(options, (error, response, body) => {
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
  });
};

exports.postTransactions = (req, res, next) => {
  options.url = common.lnd_server_url + '/channels/transactions';
  options.form = JSON.stringify({ 
    payment_request: req.body.paymentReq
  });
  console.log('Send Payment Options Form:' + options.form);
  request.post(options, (error, response, body) => {
    console.log('Send Payment Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Send Payment Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  });
};

exports.closeChannel = (req, res, next) => {
  let channelpoint = req.params.channelPoint.replace(":", "/");
  options.url = common.lnd_server_url + '/channels/' + channelpoint + '?force=' + req.query.force;
  console.log('\nClosing Channel URL: ');
  console.log(options.url);
  request.delete(options, (error, response, body) => {
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
  });
}
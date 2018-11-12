var request = require('request');
var options = require("../connect");
var common = require('../common');
var graph = require('./graph');

exports.getChannels = (req, res, next) => {
  if (undefined === req.params.channelType || req.params.channelType === 'all') {
    options.url = common.lnd_server_url + '/channels';
  } else {
    options.url = common.lnd_server_url + '/channels/' + req.params.channelType;
  }
  options.qs = req.query;
  request.get(options, (error, response, body) => {
    console.log('Request params: ' + JSON.stringify(req.params) + '\nRequest Query: ' + JSON.stringify(req.query) + ' \nChannel Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching channels failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
    }
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
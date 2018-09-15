var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.getChannels = (req, res, next) => {
  if (undefined === req.params.channelType || req.params.channelType === 'all') {
    options.url = config.lnd_server_url + '/channels';
  } else {
    options.url = config.lnd_server_url + '/channels/' + req.params.channelType;
  }
  options.qs = req.query;
  request.get(options, (error, response, body) => {
    console.log('Request params: ' + JSON.stringify(req.params) + '\nRequest Query: ' + JSON.stringify(req.query) + ' \nChannel Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching channels failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
    }
  });
};

exports.postChannel = (req, res, next) => {
  options.url = config.lnd_server_url + '/channels';
  options.form = JSON.stringify({ 
    node_pubkey_string: req.body.node_pubkey,
    local_funding_amount: req.body.local_funding_amount
  });
  request.post(options, (error, response, body) => {
    console.log('Channel Open Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Open channel failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  });
};

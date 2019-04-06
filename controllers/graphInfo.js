var request = require('request');
var options = require("../connect");
var common = require('../common');

exports.getGraphInfo = (req, res, next) => {
  options = common.getOptions(1);
  options.url = common.findNode(1).lnd_server_url + '/graph/info';
  request.get(options, (error, response, body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    console.log('Network Information Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching network Info failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.btc_total_network_capacity = (undefined === body.total_network_capacity) ? 0 : common.convertToBTC(body.total_network_capacity);
      body.btc_avg_channel_size = (undefined === body.avg_channel_size) ? 0 : common.convertToBTC(body.avg_channel_size);
      body.btc_min_channel_size = (undefined === body.min_channel_size) ? 0 : common.convertToBTC(body.min_channel_size);
      body.btc_max_channel_size = (undefined === body.max_channel_size) ? 0 : common.convertToBTC(body.max_channel_size);
      console.log('Network Information After Rounding and Conversion: ' + body_str);
      res.status(200).json(body);
    }
  });
};

var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.getGraphInfo = (req, res, next) => {
  options.url = config.lnd_server_url + '/graph/info';
  request.get(options, (error, response, body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    console.log('Network Information Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching network Info failed!",
        error: (undefined === body || search_idx > -1) ? 'ERROR From Server!' : body.error
      });
    } else {
      body.avg_out_degree = (undefined === body.avg_out_degree) ? 0 : twoDecimalRound(body.avg_out_degree);
      body.total_network_capacity = (undefined === body.total_network_capacity) ? 0 : convertToBTC(body.total_network_capacity);
      body.avg_channel_size = (undefined === body.avg_channel_size) ? 0 : convertToBTC(body.avg_channel_size);
      body.min_channel_size = (undefined === body.min_channel_size) ? 0 : convertToBTC(body.min_channel_size);
      body.max_channel_size = (undefined === body.max_channel_size) ? 0 : convertToBTC(body.max_channel_size);
      console.log('Network Information After Rounding and Conversion: ' + body_str);
      res.status(200).json(body);
    }
  });

  twoDecimalRound = (num) => {
    return num.toFixed(2);
  };

  convertToBTC = (num) => {
    return (num / 100000000).toFixed(6);
  };

};

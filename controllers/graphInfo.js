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
      res.status(200).json(body);
    }
  });
};

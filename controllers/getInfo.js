var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.getInfo = (req, res, next) => {
  options.url = config.lnd_server_url + '/getinfo';
  request.get(options, (error, response, body) => {
    console.log('Information Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching Info failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      res.status(200).json({body});
    }
  });
};

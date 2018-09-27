var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.getNewAddress = (req, res, next) => {
  options.url = config.lnd_server_url + '/newaddress';
  request.get(options, (error, response, body) => {
    console.log("New Address Received: " + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching new address failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
    }
  });
};

var request = require('request');
var options = require("../connect");
var common = require('../common');

exports.getNewAddress = (req, res, next) => {
  options.url = common.lnd_server_url + '/newaddress?type=' + req.query.type;
  console.log('Request Query Params: ' + JSON.stringify(req.query));
  console.log('Options URL: ' + JSON.stringify(options.url));
  request.get(options, (error, response, body) => {
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    console.log("New Address Received: " + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching new address failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
        res.status(200).json(body);
    }
  });
};

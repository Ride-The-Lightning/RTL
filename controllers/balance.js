var request = require('request');
var options = require("../connect");
var config = require('../config');

exports.getBalance = (req, res, next) => {
  options.url = config.lnd_server_url + '/balance/' + req.params.source;
  options.qs = req.query;
  request.get(options, (error, response, body) => {
    console.log('Request params: ' + JSON.stringify(req.params) + '\nRequest Query: ' + JSON.stringify(req.query) + ' \nBalance Received: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching balance failed!",
        error: (undefined === body) ? 'ERROR From Server!' : body.error
      });
    } else {
      res.status(200).json({balance: body});
    }
  });
};

var request = require('request');
var options = require("../connect");
var common = require('../common');

exports.getBalance = (req, res, next) => {
  // setTimeout(()=>{res.status(201).json({"balance":{"total_balance":"15305209","confirmed_balance":"15305209"}});}, 5000);
  // setTimeout(()=>{res.status(201).json({"balance":{"balance":"5983797"}});}, 5000);
  options.url = common.lnd_server_url + '/balance/' + req.params.source;
  options.qs = req.query;
  request.get(options, (error, response, body) => {
    console.log('Request params: ' + JSON.stringify(req.params) + '\nRequest Query: ' + JSON.stringify(req.query) + ' \nBalance Received: ' + JSON.stringify(body));
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    console.log('Balance Information Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching balance failed!",
        error: (undefined === body || search_idx > -1) ? 'ERROR From Server!' : body.error
      });
    } else {
      body.btc_balance = (undefined === body.balance) ? 0 : common.convertToBTC(body.balance);
      body.btc_total_balance = (undefined === body.total_balance) ? 0 : common.convertToBTC(body.total_balance);
      body.btc_confirmed_balance = (undefined === body.confirmed_balance) ? 0 : common.convertToBTC(body.confirmed_balance);
      body.btc_unconfirmed_balance = (undefined === body.unconfirmed_balance) ? 0 : common.convertToBTC(body.unconfirmed_balance);
      res.status(200).json(body);
    }
  });
};

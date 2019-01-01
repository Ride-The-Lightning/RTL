var request = require('request-promise');
var options = require("../connect");
var common = require('../common');

exports.getInfo = (req, res, next) => {
  options.url = common.lnd_server_url + '/getinfo';
  request(options).then((body) => {
    console.log('body');
    console.log(body);
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
    console.log('Information Received: ' + body_str);
    if(undefined === body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching Info failed!",
        error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching Info failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getNewAddress = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/newaddress?type=' + req.query.type;
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'NewAddress', msg: 'New Address Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching new address failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
        res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching new address failed!",
      error: err.error
    });
  });
};

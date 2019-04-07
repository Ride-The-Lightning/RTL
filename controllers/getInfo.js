var request = require('request-promise');
var common = require('../common');
var logger = require('./logger');
var options = {};

exports.getInfo = (req, res, next) => {
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/getinfo';
  logger.info('\r\nSelected Node: ' + JSON.stringify(common.selectedNode));
  logger.info('\r\nCalling getinfo from lnd server url: INFO: ' + options.url);
  request(options).then((body) => {
    logger.info('\r\nGetInfo: 9: ' + JSON.stringify(Date.now()) + ': INFO: ' + JSON.stringify(body));
    const body_str = (undefined === body) ? '' : JSON.stringify(body);
    const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
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

var request = require('request-promise');
var common = require('../../common');
var options = {};

exports.getGraphInfo = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/graph/info';
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    if(!body || search_idx > -1 || body.error) {
      res.status(500).json({
        message: "Fetching network Info failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.btc_total_network_capacity = (!body.total_network_capacity) ? 0 : common.convertToBTC(body.total_network_capacity);
      body.btc_avg_channel_size = (!body.avg_channel_size) ? 0 : common.convertToBTC(body.avg_channel_size);
      body.btc_min_channel_size = (!body.min_channel_size) ? 0 : common.convertToBTC(body.min_channel_size);
      body.btc_max_channel_size = (!body.max_channel_size) ? 0 : common.convertToBTC(body.max_channel_size);
      res.status(200).json(body);
    }
  });
};

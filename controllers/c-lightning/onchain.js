var request = require('request-promise');
var common = require('../../common');
var options = {};

exports.getNewAddress = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/newaddr?addrType=' + req.query.type;
  request(options).then((body) => {
    res.status(200).json(body);
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching new address failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getNodes = (req, res, next) => {
  options = common.getOptions();  
  options.url = common.getSelLNServerUrl() + '/nodes';
  options.form = { nodeIds: req.params.id };
  request.post(options).then(function (body) {
    logger.info({fileName: 'Network', msg: 'Node Lookup: ' + JSON.stringify(body)});
    body.forEach(node => {
      node.timestampStr =  (node.timestamp) ? common.convertTimestampToDate(node.timestamp) : '';
    });
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Network', lineNum: 49, msg: 'Node Lookup Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: 'Node Lookup Failed!',
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

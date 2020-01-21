var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var connect = require('../../connect');
var options = {};

exports.getInfo = (req, res, next) => {
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getinfo';
  logger.info({fileName:'GetInfo', msg: 'Selected Node: ' + JSON.stringify(common.selectedNode.ln_node)});
  if (!options.headers || !options.headers['Grpc-Metadata-macaroon']) {
    logger.error({fileName: 'GetInfo', lineNum: 17, msg: 'LND Get info failed due to bad or missing macaroon!'});
    res.status(502).json({
      message: "Fetching Info Failed!",
      error: "Bad Macaroon"
    });
  } else {
    common.nodes.map(node => { if (node.lnImplementation === 'LND') { connect.getAllNodeAllChannelBackup(node); }});
    logger.info({fileName: 'GetInfo', msg: 'Calling getinfo from lnd server url: ' + options.url});
    request(options).then((body) => {
      logger.info({fileName: 'GetInfo', msg: JSON.stringify(body)});
      const body_str = (undefined === body) ? '' : JSON.stringify(body);
      const search_idx = (undefined === body) ? -1 : body_str.search('Not Found');
      if(undefined === body || search_idx > -1 || body.error) {
        res.status(500).json({
          message: "Fetching Info Failed!",
          error: (undefined === body || search_idx > -1) ? 'Error From Server!' : body.error
        });
      } else {
        res.status(200).json(body);
      }
    })
    .catch(function (err) {
      return res.status(500).json({
        message: "Fetching Info Failed!",
        error: err.error
      });
    });
  }
};

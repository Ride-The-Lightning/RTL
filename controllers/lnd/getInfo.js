var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var connect = require('../../connect');
var options = {};

exports.getInfo = (req, res, next) => {
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getinfo';
  if(common.multi_node_setup) {
    logger.info({fileName:'GetInfo', msg: 'Selected Node: ' + JSON.stringify(common.selectedNode.ln_node)});
  } else {
    logger.info({fileName:'GetInfo', msg: 'Single Node Setup!'});
  }
  if (!options.headers || !options.headers['Grpc-Metadata-macaroon']) {
    logger.error({fileName: 'GetInfo', msg: 'Get info failed due to bad or missing macaroon!'});
    res.status(500).json({
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

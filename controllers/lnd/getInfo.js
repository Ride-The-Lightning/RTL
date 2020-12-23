var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var connect = require('../../connect');
var options = {};

exports.getInfo = (req, res, next) => {
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getinfo';
  logger.info({fileName:'GetInfo', msg: 'Selected Node: ' + JSON.stringify(common.selectedNode.ln_node)});
  logger.info({fileName: 'GetInfo', msg: 'Calling Info from LND server url: ' + options.url});
  if (!options.headers || !options.headers['Grpc-Metadata-macaroon']) {
    logger.error({fileName: 'GetInfo', lineNum: 17, msg: 'LND Get info failed due to bad or missing macaroon!'});
    res.status(502).json({
      message: "Fetching Info Failed!",
      error: "Bad Macaroon"
    });
  } else {
    common.nodes.map(node => { if (node.lnImplementation === 'LND') { connect.getAllNodeAllChannelBackup(node); }});
    request(options).then((body) => {
      logger.info({fileName: 'GetInfo', msg: JSON.stringify(body)});
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if(!body || search_idx > -1 || body.error) {
        logger.error({fileName: 'GetInfo', lineNum: 26, msg: 'Get Info Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
        res.status(500).json({
          message: "Fetching Info Failed!",
          error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
        });
      } else {
        res.status(200).json(body);
      }
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.error({fileName: 'GetInfo', lineNum: 42, msg: 'Get Info Error: ' + JSON.stringify(err)});
      return res.status(500).json({
        message: "Fetching Info Failed!",
        error: err.error
      });
    });
  }
};

var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var connect = require('../../routes/connect');
var options = {};

exports.getInfo = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'GetInfo', msg: 'Getting LND Node Information..'});
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getinfo';
  logger.log({level: 'DEBUG', fileName:'GetInfo', msg: 'Selected Node', data: common.selectedNode.ln_node});
  logger.log({level: 'DEBUG', fileName: 'GetInfo', msg: 'Calling Info from LND server url', data: options.url});
  if (!options.headers || !options.headers['Grpc-Metadata-macaroon']) {
    logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'LND Get info failed due to bad or missing macaroon!', error: {error: 'Bad or missing macaroon.'}});
    res.status(502).json({
      message: "Fetching Info Failed!",
      error: "Bad Macaroon"
    });
  } else {
    common.nodes.map(node => { if (node.lnImplementation === 'LND') { connect.getAllNodeAllChannelBackup(node); }});
    request(options).then((body) => {
      logger.log({level: 'DEBUG', fileName: 'GetInfo', msg: 'Node Information', data: body});
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if(!body || search_idx > -1 || body.error) {
        logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'Get Info Error', error: body.error});
        res.status(500).json({
          message: "Fetching Info Failed!",
          error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
        });
      } else {
        logger.log({level: 'INFO', fileName: 'GetInfo', msg: 'LND Node Information Received'});
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
      logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'Get Info Error', error: err});
      return res.status(500).json({
        message: "Fetching Info Failed!",
        error: err.error
      });
    });
  }
};

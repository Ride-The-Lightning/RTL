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
    const errMsg = 'LND Get info failed due to bad or missing macaroon!';
    const err = common.handleError({ statusCode: 502, message: 'Bad or Missing Macaroon', error: errMsg },  'GetInfo', errMsg);
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  } else {
    common.nodes.map(node => { 
      if (node.ln_implementation === 'LND') { 
        connect.getAllNodeAllChannelBackup(node); 
      }
    });
    request(options).then((body) => {
      logger.log({level: 'DEBUG', fileName: 'GetInfo', msg: 'Node Information', data: body});
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if (!body || search_idx > -1 || body.error) {
        if (body && !body.error) { body.error = 'Error From Server!'; }
        const err = common.handleError(body,  'GetInfo', 'Get Info Error');
        return res.status(err.statusCode).json({message: err.message, error: err.error});
      } else {
        logger.log({level: 'INFO', fileName: 'GetInfo', msg: 'LND Node Information Received'});
        res.status(200).json(body);
      }
    })
    .catch(errRes => {
      const err = common.handleError(errRes,  'GetInfo', 'Get Info Error');
      return res.status(err.statusCode).json({message: err.message, error: err.error});
    });
  }
};

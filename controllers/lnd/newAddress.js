var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getNewAddress = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'NewAddress', msg: 'Getting New Address..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/newaddress?type=' + req.query.type;
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.log({level: 'DEBUG', fileName: 'NewAddress', msg: 'New Address Received', data: body_str});
    if (!body || search_idx > -1 || body.error) {
      logger.log({level: 'ERROR', fileName: 'NewAddress', msg: 'New Address Error', error: body.error});
      res.status(500).json({
        message: "Fetching new address failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'NewAddress', msg: 'New Address Received'});
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
    logger.log({level: 'ERROR', fileName: 'NewAddress', msg: 'New Address Error', error: err});
    return res.status(500).json({
      message: "Fetching new address failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getInfo = (req, res, next) => {
  options = common.getBoltzServerOptions();
  if(options.url === '') { return res.status(500).json({message: "Boltz Get Info Failed!",error: { message: 'Boltz Server URL is missing in the configuration.'}}); }
  options.url = options.url + '/v1/info';
  request(options).then(function (body) {
    logger.info({fileName: 'Boltz', msg: 'Boltz Get Info: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Boltz', lineNum: 22, msg: 'Boltz Get Info Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Boltz Get Info Failed!",
      error: (err.error && err.error.error) ? err.error.error : (err.error) ? err.error : err
    });
  });
};

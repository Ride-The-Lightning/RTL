var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getInfo = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'GetInfo', msg: 'Getting Eclair Node Information..'});
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getinfo';
  options.form = {};
  logger.log({level: 'DEBUG', fileName:'GetInfo', msg: 'Selected Node', data: common.selectedNode.ln_node});
  logger.log({level: 'DEBUG', fileName: 'GetInfo', msg: 'Calling Info from Eclair server url', data: options.url});
  if (common.read_dummy_data) {
    common.getDummyData('GetInfo').then(function(data) { 
      data.lnImplementation = 'Eclair';
      res.status(200).json(data); 
    });
  } else {
    if (!options.headers || !options.headers.authorization) {
      logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'Eclair Get info failed due to missing or wrong password!', error: {error: 'Missing or wrong password.'}});
      res.status(502).json({
        message: "Fetching Info Failed!",
        error: "Missing Or Wrong Password"
      });
    } else {
      request.post(options).then((body) => {
        logger.log({level: 'DEBUG', fileName: 'GetInfo', msg: 'Get Info Response', data: body});
        const body_str = (!body) ? '' : JSON.stringify(body);
        const search_idx = (!body) ? -1 : body_str.search('Not Found');
        body.lnImplementation = 'Eclair';
        logger.log({level: 'INFO', fileName: 'GetInfo', msg: 'Eclair Node Information Received'});
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
        logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'Get Info Error', error: err});
        return res.status(err.statusCode ? err.statusCode : 500).json({
          message: "Fetching Info failed!",
          error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
        });
      });
    }
  }
};

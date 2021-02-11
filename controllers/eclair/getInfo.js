var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getInfo = (req, res, next) => {
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getinfo';
  options.form = {};
  logger.info({fileName:'GetInfo', msg: 'Selected Node: ' + JSON.stringify(common.selectedNode.ln_node)});
  logger.info({fileName: 'GetInfo', msg: 'Calling Info from Eclair server url: ' + options.url});
  if (common.read_dummy_data) {
    common.getDummyData('GetInfo').then(function(data) { 
      data.currency_unit = 'BTC';
      data.smaller_currency_unit = 'Sats';
      data.lnImplementation = 'Eclair';
      res.status(200).json(data); 
    });
  } else {
    if (!options.headers || !options.headers.authorization) {
      logger.error({fileName: 'GetInfo', lineNum: 13, msg: 'Eclair Get info failed due to missing or wrong password!'});
      res.status(502).json({
        message: "Fetching Info Failed!",
        error: "Missing Or Wrong Password"
      });
    } else {
      request.post(options).then((body) => {
        logger.info({fileName: 'GetInfo', msg: 'Get Info Response: ' + JSON.stringify(body)});
        const body_str = (!body) ? '' : JSON.stringify(body);
        const search_idx = (!body) ? -1 : body_str.search('Not Found');
        body.currency_unit = 'BTC';
        body.smaller_currency_unit = 'Sats';
        body.lnImplementation = 'Eclair';
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
        logger.error({fileName: 'GetInfo', lineNum: 57, msg: 'Get Info Error: ' + JSON.stringify(err)});
        return res.status(err.statusCode ? err.statusCode : 500).json({
          message: "Fetching Info failed!",
          error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
        });
      });
    }
  }
};

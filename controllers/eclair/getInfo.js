var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getInfo = (req, res, next) => {
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/getinfo';
  logger.info({fileName:'GetInfo', msg: 'Selected Node: ' + JSON.stringify(common.selectedNode.ln_node)});
  logger.info({fileName: 'GetInfo', msg: 'Calling Info from Eclair server url: ' + options.url});
  if (!options.headers || !options.headers.authorization) {
    logger.error({fileName: 'GetInfo', lineNum: 13, msg: 'Eclair Get info failed due to missing or wrong password!'});
    res.status(502).json({
      message: "Fetching Info Failed!",
      error: "Missing Or Wrong Password"
    });
  } else {
    request.post(options).then((body) => {
      logger.info({fileName: 'GetInfo', msg: JSON.stringify(body)});
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if(!body || search_idx > -1 || body.error) {
        logger.error({fileName: 'GetInfo', lineNum: 24, msg: 'Get Info Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
        res.status(500).json({
          message: "Fetching Info failed!",
          error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
        });
      } else {
        body.currency_unit = 'BTC';
        body.smaller_currency_unit = 'Sats';
        body.lnImplementation = 'Eclair';
        // let chainObj = { chain: '', network: '' };
        // if (body.network === 'testnet') {
        //   chainObj.chain = 'Bitcoin';
        //   chainObj.network = 'Testnet';
        // } else if (body.network === 'bitcoin') {
        //   chainObj.chain = 'Bitcoin';
        //   chainObj.network = 'Mainnet';
        // } else if (body.network === 'litecoin') {
        //   chainObj.chain = 'Litecoin';
        //   chainObj.network = 'Mainnet';
        // } else if (body.network === 'litecoin-testnet') {
        //   chainObj.chain = 'Litecoin';
        //   chainObj.network = 'Testnet';
        // }
        // body.chains = [chainObj];
        // body.uris = [];
        // if (body.address && body.address.length>0) {
        //   body.address.forEach(addr => {
        //     body.uris.push(body.id + '@' + addr.address + ':' + addr.port);
        //   });
        // }
        res.status(200).json(body);
      }
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
      return res.status(500).json({
        message: "Fetching Info failed!",
        error: err.error
      });
    });
  }
};

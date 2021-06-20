var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.getInfo = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'GetInfo', msg: 'Getting CLightning Node Information..'});
  common.setOptions();
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getinfo';
  logger.log({level: 'DEBUG', fileName:'GetInfo', msg: 'Selected Node', data: common.selectedNode.ln_node});
  logger.log({level: 'DEBUG', fileName: 'GetInfo', msg: 'Calling Info from C-Lightning server url', data: options.url});
  if (!options.headers || !options.headers.macaroon) {
    logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'C-Lightning Get info failed due to bad or missing macaroon!', error: {error: 'Bad macaroon.'}});
    res.status(502).json({
      message: "Fetching Info Failed!",
      error: "Bad Macaroon"
    });
  } else {
    request(options).then((body) => {
      logger.log({level: 'DEBUG', fileName: 'GetInfo', msg: 'Node Information', data: body});
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if(!body || search_idx > -1 || body.error) {
        logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'Get Info Error', error: body.error});
        res.status(500).json({
          message: "Fetching Info failed!",
          error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
        });
      } else {
        body.currency_unit = 'BTC';
        body.smaller_currency_unit = 'Sats';
        body.lnImplementation = 'C-Lightning';
        let chainObj = { chain: '', network: '' };
        if (body.network === 'testnet') {
          chainObj.chain = 'Bitcoin';
          chainObj.network = 'Testnet';
        } else if (body.network === 'bitcoin') {
          chainObj.chain = 'Bitcoin';
          chainObj.network = 'Mainnet';
        } else if (body.network === 'litecoin') {
          chainObj.chain = 'Litecoin';
          chainObj.network = 'Mainnet';
        } else if (body.network === 'litecoin-testnet') {
          chainObj.chain = 'Litecoin';
          chainObj.network = 'Testnet';
        }
        body.chains = [chainObj];
        body.uris = [];
        if (body.address && body.address.length>0) {
          body.address.forEach(addr => {
            body.uris.push(body.id + '@' + addr.address + ':' + addr.port);
          });
        }
        logger.log({level: 'INFO', fileName: 'GetInfo', msg: 'CLightning Node Information Received'});
        res.status(200).json(body);
      }
    })
    .catch(errRes => {
      let err = JSON.parse(JSON.stringify(errRes));
      if (err.options && err.options.headers && err.options.headers.macaroon) {
        delete err.options.headers.macaroon;
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
        delete err.response.request.headers.macaroon;
      }
      logger.log({level: 'ERROR', fileName: 'GetInfo', msg: 'Get Info Error', error: err});
      return res.status(500).json({
        message: "Fetching Info failed!",
        error: err.error
      });
    });
  }
};

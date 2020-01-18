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
  logger.info({fileName: 'GetInfo', msg: 'Calling getinfo from c-lightning server url: ' + options.url});
  request(options).then((body) => {
    logger.info({fileName: 'GetInfo', msg: JSON.stringify(body)});
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    if(!body || search_idx > -1 || body.error) {
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
      res.status(200).json(body);
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching Info failed!",
      error: err.error
    });
  });
};

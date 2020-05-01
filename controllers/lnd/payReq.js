var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.decodePayment = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/payreq/' + req.params.payRequest;
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'PayReq', msg: 'Payment Decode Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.error({fileName: 'PayReq', lineNum: 14, msg: 'Payment Decode Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Payment Request Decode Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.btc_num_satoshis = (!body.num_satoshis) ? 0 : common.convertToBTC(body.num_satoshis);
      body.timestamp_str =  (!body.timestamp) ? '' : common.convertTimestampToDate(body.timestamp);
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
    logger.error({fileName: 'PayReq', lineNum: 32, msg: 'Payment Decode Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Payment Request Decode Failed!",
      error: err.error
    });
  });
};

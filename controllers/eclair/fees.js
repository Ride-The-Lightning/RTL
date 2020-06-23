var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getFees = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/audit';
  tillToday = Math.floor(Date.now() / 1000);
  fromLastMonth = tillToday - (86400 * 30);
  options.qs.from = fromLastMonth;
  options.qs.to = tillToday;
  request.post(options).then((body) => {
    body.daily_fee = 0;
    body.daily_txs = 0;
    body.weekly_fee = 0;
    body.weekly_txs = 0;
    body.monthly_fee = 0;
    body.monthly_txs = 0;
    let current_time = Math.round((new Date().getTime()) / 1000);
    let month_start_time = current_time - 2629743;
    let week_start_time = current_time - 604800;
    let day_start_time = current_time - 86400;
    let fee = 0;
    body.relayed.forEach(relayedEle => {
      logger.info({fileName: 'Fees', msg: 'Relayed Transaction: ' + JSON.stringify(relayedEle)});
      fee = relayedEle.amountIn - relayedEle.amountOut;
      if (relayedEle.timestamp >= day_start_time) {
        body.daily_fee = body.daily_fee + fee;
        body.daily_txs = body.daily_txs + 1;
      }
      if (relayedEle.timestamp >= week_start_time) {
        body.weekly_fee = body.weekly_fee + fee;
        body.weekly_txs = body.weekly_txs + 1;
      }
      if (relayedEle.timestamp >= month_start_time) {
        body.monthly_fee = body.monthly_fee + fee;
        body.monthly_txs = body.monthly_txs + 1;
      }
    });
    logger.info({fileName: 'Fees', msg: JSON.stringify(body)});
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
    logger.error({fileName: 'Fees', lineNum: 57, msg: 'Get Fees Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Fetching Fees failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getFees = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/audit';
  tillToday = Math.floor(Date.now() / 1000);
  fromLastMonth = tillToday - (86400 * 30);
  options.form = {
    from: fromLastMonth,
    to: tillToday
  };
  request.post(options).then((body) => {
    logger.info({fileName: 'Fees', msg: 'Audit Response: ' + JSON.stringify(body)});
    let resBody = {
      fees: {daily_fee: 0, daily_txs: 0, weekly_fee: 0, weekly_txs: 0, monthly_fee: 0, monthly_txs: 0 },
      payments: { 
        sent: body && body.sent ? body.sent : [],
        received: body && body.received ? body.received : [],
        relayed: body && body.relayed ? body.relayed : []
      }
    };
    let current_time = Math.round((new Date().getTime()) / 1000);
    let month_start_time = current_time - 2629743;
    let week_start_time = current_time - 604800;
    let day_start_time = current_time - 86400;
    let fee = 0;
    resBody.payments.relayed.forEach(relayedEle => {
      logger.info({fileName: 'Fees', msg: 'Relayed Transaction: ' + JSON.stringify(relayedEle)});
      fee = relayedEle.amountIn - relayedEle.amountOut;
      if (relayedEle.timestamp >= day_start_time) {
        resBody.fees.daily_fee = resBody.fees.daily_fee + fee;
        resBody.fees.daily_txs = resBody.fees.daily_txs + 1;
      }
      if (relayedEle.timestamp >= week_start_time) {
        resBody.fees.weekly_fee = resBody.fees.weekly_fee + fee;
        resBody.fees.weekly_txs = resBody.fees.weekly_txs + 1;
      }
      if (relayedEle.timestamp >= month_start_time) {
        resBody.fees.monthly_fee = resBody.fees.monthly_fee + fee;
        resBody.fees.monthly_txs = resBody.fees.monthly_txs + 1;
      }
    });
    resBody.payments.relayed = common.sortDescByKey(resBody.payments.relayed, 'timestamp');
    logger.info({fileName: 'Fees', msg: JSON.stringify(resBody)});
    res.status(200).json(resBody);
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

var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var swtch = require('./switch');
var options = {};

exports.getFees = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/fees';
  request(options).then((body) => {
    logger.info({fileName: 'Fees', msg: 'Fee Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Fees', lineNum: 13, msg: 'Get Fee Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching fee failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      let today = new Date(Date.now());
      let timezone_offset = today.getTimezoneOffset() * 60;
      let start_date = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
      let end_date = new Date(today.getFullYear(), today.getMonth(), common.getMonthDays(today.getMonth(), today.getFullYear()), 23, 59, 59);
      let current_time = (Math.round(end_date.getTime()/1000) - timezone_offset).toString();
      let month_start_time = (Math.round(start_date.getTime()/1000) - timezone_offset).toString();
      let week_start_time = current_time - 604800;
      let day_start_time = current_time - 86400;
      swtch.getAllForwardingEvents(month_start_time, current_time, 0, (history) => {
        logger.info({fileName: 'Fees', msg: 'Forwarding History Received: ' + JSON.stringify(history)});
        daily_sum = history.forwarding_events.reduce((acc, curr) => (curr.timestamp >= day_start_time) ? [(acc[0] + 1), (acc[1] + +curr.fee_msat)] : acc, [0, 0]);
        weekly_sum = history.forwarding_events.reduce((acc, curr) => (curr.timestamp >= week_start_time) ? [(acc[0] + 1), (acc[1] + +curr.fee_msat)] : acc, [0, 0]);
        monthly_sum = history.forwarding_events.reduce((acc, curr) => [(acc[0] + 1), (acc[1] + +curr.fee_msat)], [0, 0]);
        logger.info({fileName: 'Fees', msg: 'Daily Sum (Transactions, Fee): ' + daily_sum});
        logger.info({fileName: 'Fees', msg: 'Weekly Sum (Transactions, Fee): ' + weekly_sum});
        logger.info({fileName: 'Fees', msg: 'Monthly Sum (Transactions, Fee): ' + monthly_sum});
        body.daily_tx_count = daily_sum[0];
        body.weekly_tx_count = weekly_sum[0];
        body.monthly_tx_count = monthly_sum[0];
        body.day_fee_sum = (daily_sum[1] / 1000).toFixed(2);
        body.week_fee_sum = (weekly_sum[1] / 1000).toFixed(2);
        body.month_fee_sum = (monthly_sum[1] / 1000).toFixed(2);
        body.btc_day_fee_sum = common.convertToBTC(body.day_fee_sum);
        body.btc_week_fee_sum = common.convertToBTC(body.week_fee_sum);
        body.btc_month_fee_sum = common.convertToBTC(body.month_fee_sum);
        body.forwarding_events_history = history;
        if (history.error) { 
          logger.error({fileName: 'Fees', lineNum: 50, msg: 'Fetch Forwarding Events Error: ' + JSON.stringify(history.error)}); 
        }
        res.status(200).json(body);
      })
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
    logger.error({fileName: 'Fees', lineNum: 63, msg: 'Fetch Forwarding Events Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching fee failed!",
      error: err.error
    });
  });
};

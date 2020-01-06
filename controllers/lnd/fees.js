var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var swtch = require('./switch');
var options = {};

exports.getFees = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/fees';
  request(options).then((body) => {
    logger.info({fileName: 'Fees', msg: 'Fee Received: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Fetching fee failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined === body.day_fee_sum) {
        body.day_fee_sum = 0;
        body.btc_day_fee_sum = 0;
      } else {
        body.btc_day_fee_sum = common.convertToBTC(body.day_fee_sum);
      }
      if (undefined === body.week_fee_sum) {
        body.week_fee_sum = 0;
        body.btc_week_fee_sum = 0;
      } else {
        body.btc_week_fee_sum = common.convertToBTC(body.week_fee_sum);
      }
      if (undefined === body.month_fee_sum) {
        body.month_fee_sum = 0;
        body.btc_month_fee_sum = 0;
      } else {
        body.btc_month_fee_sum = common.convertToBTC(body.month_fee_sum);
      }
      let current_time = Math.round((new Date().getTime()) / 1000);
      let month_start_time = current_time - 2629743;
      let week_start_time = current_time - 604800;
      let day_start_time = current_time - 86400;
      return swtch.getAllForwardingEvents(month_start_time, current_time, 0, 1000)
      .then((history) => {
        logger.info({fileName: 'Fees', msg: 'Forwarding History Received: ' + JSON.stringify(history)});
        let daily_tx_count = history.forwarding_events.filter(event => event.timestamp >= day_start_time);
        body.daily_tx_count = daily_tx_count && daily_tx_count.length ? daily_tx_count.length : 0;
        let weekly_tx_count = history.forwarding_events.filter(event => event.timestamp >= week_start_time);
        body.weekly_tx_count = weekly_tx_count && weekly_tx_count.length ? weekly_tx_count.length : 0;
        body.monthly_tx_count = history.forwarding_events && history.forwarding_events.length ? history.forwarding_events.length : 0;
        return res.status(200).json(body);
      })
      .catch(err => {
        logger.error({fileName: 'Fees', lineNum: 54, msg: 'Fetch Fee Error: ' + JSON.stringify(err)});
        return res.status(500).json({
          message: "Fetching fee failed!",
          error: err.error
        });        
      });
    }
  })
  .catch(function (err) {
    return res.status(500).json({
      message: "Fetching fee failed!",
      error: err.error
    });
  });
};

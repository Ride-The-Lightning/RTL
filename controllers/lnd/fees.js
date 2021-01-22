var request = require('request-promise');
var common = require('../../common');
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
      if (!body.day_fee_sum) {
        body.day_fee_sum = 0;
        body.btc_day_fee_sum = 0;
      } else {
        body.btc_day_fee_sum = common.convertToBTC(body.day_fee_sum);
      }
      if (!body.week_fee_sum) {
        body.week_fee_sum = 0;
        body.btc_week_fee_sum = 0;
      } else {
        body.btc_week_fee_sum = common.convertToBTC(body.week_fee_sum);
      }
      if (!body.month_fee_sum) {
        body.month_fee_sum = 0;
        body.btc_month_fee_sum = 0;
      } else {
        body.btc_month_fee_sum = common.convertToBTC(body.month_fee_sum);
      }
      let today = new Date(Date.now());
      let current_time = Math.round((today.getTime()) / 1000);
      let month_start_time = Math.round((new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 1, 0, 0, 0).getTime()) / 1000);
      let week_start_time = current_time - 604800;
      let day_start_time = current_time - 86400;
      swtch.getAllForwardingEvents(month_start_time, current_time, 0, (history) => {
        logger.info({fileName: 'Fees', msg: 'Forwarding History Received: ' + JSON.stringify(history)});
        let daily_tx_count = history.forwarding_events.filter(event => event.timestamp >= day_start_time);
        body.daily_tx_count = daily_tx_count && daily_tx_count.length ? daily_tx_count.length : 0;
        let weekly_tx_count = history.forwarding_events.filter(event => event.timestamp >= week_start_time);
        body.weekly_tx_count = weekly_tx_count && weekly_tx_count.length ? weekly_tx_count.length : 0;
        body.monthly_tx_count = history.forwarding_events && history.forwarding_events.length ? history.forwarding_events.length : 0;
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

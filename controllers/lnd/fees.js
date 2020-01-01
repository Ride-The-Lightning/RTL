var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
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

      let startDate = new Date();
      let day_start_time = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - 1);
      day_start_time = Math.round(day_start_time.getTime() / 1000).toString();
      let week_start_time = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - 7);
      week_start_time = Math.round(week_start_time.getTime() / 1000).toString();
      let month_start_time = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() - 30);
      return getFwdTransactions(Math.round(month_start_time.getTime() / 1000).toString())
      .then((history) => {
        let daily_tx_count = history.filter(event => event.timestamp >= day_start_time);
        body.daily_tx_count = daily_tx_count && daily_tx_count.length ? daily_tx_count.length : 0;
        let weekly_tx_count = history.filter(event => event.timestamp >= week_start_time);
        body.weekly_tx_count = weekly_tx_count && weekly_tx_count.length ? weekly_tx_count.length : 0;
        body.monthly_tx_count = history && history.length ? history.length : 0;
        return res.status(200).json(body);
      })
      .catch(err => {
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

getFwdTransactions = (start_time) => {
  return new Promise(function(resolve, reject) {
    options.url = common.getSelLNServerUrl() + '/switch';
    options.form = {};
    let endDate = new Date();

    if (undefined !== start_time) {
      options.form.start_time = start_time;
    }
    end_time = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    options.form.end_time = Math.round(this.end_time.getTime() / 1000).toString();
    options.form = JSON.stringify(options.form);
    logger.info({fileName: 'Fees', msg: 'Switch Post Options: ' + JSON.stringify(options)});
    request.post(options).then((body) => {
      try {
        logger.info({fileName: 'Fees', msg: 'Switch Post Response: ' + JSON.stringify(body)});
        if(undefined === body || body.error) {
          logger.error({fileName: 'Fees', lineNum: 78, msg: 'Switch Post Error: ' + JSON.stringify((undefined === body) ? 'Error From Server!' : body.error)});
          res.status(500).json({
            message: "Switch post failed!",
            error: (undefined === body) ? 'Error From Server!' : body.error
          });
        } else {
          if (undefined !== body.forwarding_events && body.forwarding_events.length > 0) {
            body.forwarding_events.forEach(event => {
              event.timestamp_str =  (undefined === event.timestamp) ? '' : common.convertTimestampToDate(event.timestamp);
            });
            body.forwarding_events = common.sortDescByKey(body.forwarding_events, 'timestamp');
            logger.info({fileName: 'Fees', msg: 'Forwarding History Received: ' + JSON.stringify(body)});
            resolve(body.forwarding_events);  
          }
        }  
      } catch (err) {
        resolve(err);
      }
    })
  });
}
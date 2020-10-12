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
    logger.info({fileName: 'Fees', msg: 'Fee Response: ' + JSON.stringify(body)});
    let fees = { daily_fee: 0, daily_txs: 0, weekly_fee: 0, weekly_txs: 0, monthly_fee: 0, monthly_txs: 0 };
    let current_time = Math.round((new Date().getTime()));
    let month_start_time = current_time - 2629743000;
    let week_start_time = current_time - 604800000;
    let day_start_time = current_time - 86400000;
    let fee = 0;
    body.relayed.forEach(relayedEle => {
      logger.info({fileName: 'Fees', msg: 'Fee Relayed Transaction: ' + JSON.stringify(relayedEle)});
      fee = Math.round((relayedEle.amountIn - relayedEle.amountOut)/1000);
      if (relayedEle.timestamp >= day_start_time) {
        fees.daily_fee = fees.daily_fee + fee;
        fees.daily_txs = fees.daily_txs + 1;
      }
      if (relayedEle.timestamp >= week_start_time) {
        fees.weekly_fee = fees.weekly_fee + fee;
        fees.weekly_txs = fees.weekly_txs + 1;
      }
      if (relayedEle.timestamp >= month_start_time) {
        fees.monthly_fee = fees.monthly_fee + fee;
        fees.monthly_txs = fees.monthly_txs + 1;
      }
    });
    logger.info({fileName: 'Fees', msg: JSON.stringify(fees)});
    res.status(200).json(fees);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Fees', lineNum: 51, msg: 'Get Fees Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Fetching Fees failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.getPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/audit';
  options.form = null;
  request.post(options).then((body) => {
    logger.info({fileName: 'Fees', msg: 'Payments Response: ' + JSON.stringify(body)});
    let payments = { 
      sent: body && body.sent ? body.sent : [],
      received: body && body.received ? body.received : [],
      relayed: body && body.relayed ? body.relayed : []
    };
    payments.sent.forEach(sentEle => {
      if (sentEle.recipientAmount) { sentEle.recipientAmount = Math.round(sentEle.recipientAmount/1000); }
      if (sentEle.parts && sentEle.parts.length > 0) { 
        sentEle.firstPartTimestamp = sentEle.parts[0].timestamp;
        sentEle.firstPartTimestampStr =  (!sentEle.firstPartTimestamp) ? '' : common.convertTimestampToDate(Math.round(sentEle.firstPartTimestamp / 1000));
      }
      sentEle.parts.forEach(part => {
        part.timestampStr =  (!part.timestamp) ? '' : common.convertTimestampToDate(Math.round(part.timestamp / 1000));
        if (part.amount) { part.amount = Math.round(part.amount/1000); }
        if (part.feesPaid) { part.feesPaid = Math.round(part.feesPaid/1000); }
      });
    });
    payments.received.forEach(receivedEle => {
      if (receivedEle.parts && receivedEle.parts.length > 0) { 
        receivedEle.firstPartTimestamp = receivedEle.parts[0].timestamp;
        receivedEle.firstPartTimestampStr =  (!receivedEle.firstPartTimestamp) ? '' : common.convertTimestampToDate(Math.round(receivedEle.firstPartTimestamp / 1000));
      }
      receivedEle.parts.forEach(part => {
        part.timestampStr =  (!part.timestamp) ? '' : common.convertTimestampToDate(Math.round(part.timestamp / 1000));
        if (part.amount) { part.amount = Math.round(part.amount/1000); }
      });      
    });
    payments.relayed.forEach(relayedEle => {
      logger.info({fileName: 'Fees', msg: 'Payment Relayed Transaction: ' + JSON.stringify(relayedEle)});
      relayedEle.timestampStr =  (!relayedEle.timestamp) ? '' : common.convertTimestampToDate(Math.round(relayedEle.timestamp / 1000));
      if (relayedEle.amountIn) { relayedEle.amountIn = Math.round(relayedEle.amountIn/1000); }
      if (relayedEle.amountOut) { relayedEle.amountOut = Math.round(relayedEle.amountOut/1000); }
    });
    payments.sent = common.sortDescByKey(payments.sent, 'firstPartTimestamp');
    payments.received = common.sortDescByKey(payments.received, 'firstPartTimestamp');
    payments.relayed = common.sortDescByKey(payments.relayed, 'timestamp');
    logger.info({fileName: 'Fees', msg: JSON.stringify(payments)});
    res.status(200).json(payments);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Fees', lineNum: 113, msg: 'Get Payments Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Fetching Payments failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

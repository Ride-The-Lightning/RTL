var request = require('request-promise');
var common = require('../../utils/common');
var logger = require('../../utils/logger');
var options = {};

arrangeFees = (body, current_time) => {
  let fees = { daily_fee: 0, daily_txs: 0, weekly_fee: 0, weekly_txs: 0, monthly_fee: 0, monthly_txs: 0 };
  let week_start_time = current_time - 604800000;
  let day_start_time = current_time - 86400000;
  let fee = 0;
  body.relayed.forEach(relayedEle => {
    fee = Math.round((relayedEle.amountIn - relayedEle.amountOut)/1000);
    if (relayedEle.timestamp >= day_start_time) {
      fees.daily_fee = fees.daily_fee + fee;
      fees.daily_txs = fees.daily_txs + 1;
    }
    if (relayedEle.timestamp >= week_start_time) {
      fees.weekly_fee = fees.weekly_fee + fee;
      fees.weekly_txs = fees.weekly_txs + 1;
    }
    fees.monthly_fee = fees.monthly_fee + fee;
    fees.monthly_txs = fees.monthly_txs + 1;
  });
  logger.log({level: 'DEBUG', fileName: 'Fees', msg: 'Arranged Fee', data: fees});
  return fees;
};

arrangePayments = (body) => {
  let payments = { 
    sent: body && body.sent ? body.sent : [],
    received: body && body.received ? body.received : [],
    relayed: body && body.relayed ? body.relayed : []
  };
  payments.sent.forEach(sentEle => {
    if (sentEle.recipientAmount) { sentEle.recipientAmount = Math.round(sentEle.recipientAmount/1000); }
    if (sentEle.parts && sentEle.parts.length > 0) { 
      sentEle.firstPartTimestamp = sentEle.parts[0].timestamp;
    }
    sentEle.parts.forEach(part => {
      if (part.amount) { part.amount = Math.round(part.amount/1000); }
      if (part.feesPaid) { part.feesPaid = Math.round(part.feesPaid/1000); }
    });
  });
  payments.received.forEach(receivedEle => {
    if (receivedEle.parts && receivedEle.parts.length > 0) { 
      receivedEle.firstPartTimestamp = receivedEle.parts[0].timestamp;
    }
    receivedEle.parts.forEach(part => {
      if (part.amount) { part.amount = Math.round(part.amount/1000); }
    });      
  });
  payments.relayed.forEach(relayedEle => {
    if (relayedEle.amountIn) { relayedEle.amountIn = Math.round(relayedEle.amountIn/1000); }
    if (relayedEle.amountOut) { relayedEle.amountOut = Math.round(relayedEle.amountOut/1000); }
  });
  payments.sent = common.sortDescByKey(payments.sent, 'firstPartTimestamp');
  payments.received = common.sortDescByKey(payments.received, 'firstPartTimestamp');
  payments.relayed = common.sortDescByKey(payments.relayed, 'timestamp');
  logger.log({level: 'DEBUG', fileName: 'Fees', msg: 'Arranged Payments', data: payments});
  return payments;
};

exports.getFees = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Fees', msg: 'Getting Fees..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/audit';
  let today = new Date(Date.now());
  let tillToday = (Math.round(today.getTime()/1000)).toString();
  let fromLastMonth = (Math.round(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 1, 0, 0, 0).getTime()/1000)).toString();
  options.form = {
    from: fromLastMonth,
    to: tillToday
  };
  logger.log({level: 'DEBUG', fileName: 'Fees', msg: 'Fee Audit Options', data: options.form});
  if (common.read_dummy_data) {
    common.getDummyData('Fees').then(function(data) { res.status(200).json(arrangeFees(data, Math.round((new Date().getTime())))); });
  } else {
    request.post(options).then((body) => {
      logger.log({level: 'DEBUG', fileName: 'Fees', msg: 'Fee Response', data: body});
      logger.log({level: 'INFO', fileName: 'Fees', msg: 'Fee Received'});
      res.status(200).json(arrangeFees(body, Math.round((new Date().getTime()))));
    })
    .catch(errRes => {
      const err = common.handleError(errRes,  'Fees', 'Get Fees Error');
      return res.status(err.statusCode).json({message: err.message, error: err.error});
    });
  }
};

exports.getPayments = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Fees', msg: 'Getting Payments..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/audit';
  options.form = null;
  if (common.read_dummy_data) {
    common.getDummyData('Payments').then(function(data) { res.status(200).json(arrangePayments(data)); });
  } else {
    request.post(options).then((body) => {
      logger.log({level: 'DEBUG', fileName: 'Fees', msg: 'Payments Response', data: body});
      logger.log({level: 'INFO', fileName: 'Fees', msg: 'Payments Received'});
      res.status(200).json(arrangePayments(body));
    })
    .catch(errRes => {
      const err = common.handleError(errRes,  'Fees', 'Get Payments Error');
      return res.status(err.statusCode).json({message: err.message, error: err.error});
    });
  }
};

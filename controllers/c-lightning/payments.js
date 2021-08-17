var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

function paymentReducer(accumulator, currentPayment) {
  let currPayHash = currentPayment.payment_hash;
  if (!currentPayment.partid) { currentPayment.partid = 0; }
  if (!accumulator[currPayHash]) {
    accumulator[currPayHash] = [currentPayment];
  } else {
    accumulator[currPayHash].push(currentPayment);
  }
  return accumulator;
}

function summaryReducer(accumulator, mpp) {
  if (mpp.status === 'complete') {
    accumulator.msatoshi = accumulator.msatoshi + mpp.msatoshi;
    accumulator.msatoshi_sent = accumulator.msatoshi_sent + mpp.msatoshi_sent;
    accumulator.status = mpp.status;
  }
  return accumulator;
}

function groupBy(payments) {
  let temp = null;
  let paymentsInGroups = payments.reduce(paymentReducer, {});
  let paymentsGrpArray = Object.keys(paymentsInGroups).map(key => (paymentsInGroups[key].length && paymentsInGroups[key].length > 1) ? common.sortDescByKey(paymentsInGroups[key], 'partid') : paymentsInGroups[key]);
  return paymentsGrpArray.reduce((acc, curr) => {
    if (curr.length && curr.length === 1) {
      temp = JSON.parse(JSON.stringify(curr));
      temp[0].is_group = false;
      temp[0].is_expanded = false;
      temp[0].total_parts = 1;
      delete temp[0].partid;
    } else {
      temp = {};
      let paySummary = curr.reduce(summaryReducer, {msatoshi: 0, msatoshi_sent: 0, status: (curr[0] && curr[0].status) ? curr[0].status : 'failed'});
      temp = {is_group: true, is_expanded: false, total_parts: (curr.length ? curr.length : 0), status: paySummary.status, payment_hash: curr[0].payment_hash, 
      destination: curr[0].destination, msatoshi: paySummary.msatoshi, msatoshi_sent: paySummary.msatoshi_sent, created_at: curr[0].created_at, 
      mpps: curr};
    }
    return acc.concat(temp);
  }, []);
}

exports.listPayments = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'List Payments..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/pay/listPayments';
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Payment List Received', data: body.payments});
    if ( body &&  body.payments && body.payments.length > 0) {
      body.payments = common.sortDescByKey(body.payments, 'created_at');
    }
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'List Payments Received'});
    res.status(200).json(groupBy(body.payments));
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Payments', 'List Payments Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

exports.decodePayment = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Payments', msg: 'Decoding Payment..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/pay/decodePay/' + req.params.invoice;
  request(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Payment Decode Received', data: body});
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Payment Decoded'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Payments', 'Decode Payment Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

exports.postPayment = (req, res, next) => {
  options = common.getOptions();
  if (req.params.type === 'keysend') {
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Keysend Payment..'});
    options.url = common.getSelLNServerUrl() + '/v1/pay/keysend';
  } else {
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Send Payment..'});
    options.url = common.getSelLNServerUrl() + '/v1/pay';
  }
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Payments', msg: 'Send Payment Response', data: body});
    logger.log({level: 'INFO', fileName: 'Payments', msg: 'Payment Sent'});
    res.status(201).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Payments', 'Send Payment Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

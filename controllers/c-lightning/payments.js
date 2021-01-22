var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

function paymentReducer(accumulator, currentPayment) {
  let currPayHash = currentPayment.payment_hash;
  if (!currentPayment.partid) { currentPayment.partid = 0; }
  if(!accumulator[currPayHash]) {
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
      created_at_str: curr[0].created_at_str, mpps: curr};
    }
    return acc.concat(temp);
  }, []);
}

exports.listPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/pay/listPayments';
  request(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Payment List Received: ' + JSON.stringify(body.payments)});
    if(!body || body.error) {
      logger.error({fileName: 'Payments', lineNum: 12, msg: 'Payments List Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Payments List Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      if ( body &&  body.payments && body.payments.length > 0) {
        body.payments.forEach(payment => {
          payment.created_at_str =  (!payment.created_at) ? '' : common.convertTimestampToDate(payment.created_at);
        });        
        body.payments = common.sortDescByKey(body.payments, 'created_at');
      }
      res.status(200).json(groupBy(body.payments));
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.error({fileName: 'Payments', lineNum: 34, msg: 'Payments List Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Payments List Failed!",
      error: err.error
    });
  });
};

exports.decodePayment = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/pay/decodePay/' + req.params.invoice;
  request(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Payment Decode Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Payments', lineNum: 48, msg: 'Payment Decode Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Payment Request Decode Failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      body.created_at_str =  (!body.created_at) ? '' : common.convertTimestampToDate(body.created_at);
      body.expire_at_str =  (!body.created_at || !body.expiry) ? '' : common.convertTimestampToDate(body.created_at + body.expiry);
      res.status(200).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.error({fileName: 'Payments', lineNum: 66, msg: 'Payment Decode Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Payment Request Decode Failed!",
      error: err.error
    });
  });
};

exports.postPayment = (req, res, next) => {
  options = common.getOptions();
  if (req.params.type === 'keysend') {
    options.url = common.getSelLNServerUrl() + '/v1/pay/keysend';
  } else {
    options.url = common.getSelLNServerUrl() + '/v1/pay';
  }
  options.body = req.body;
  request.post(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Send Payment Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Payments', lineNum: 81, msg: 'Send Payment Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Send Payment Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.error({fileName: 'Payments', lineNum: 97, msg: 'Send Payments Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Send Payment Failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

function _groupPayments(payments) {
  return Object.values(payments.reduce((result, current) => {
    const multi = !!current.partid;

    result[current.payment_hash] = result[current.payment_hash] || {
      id: current.id,
      payment_hash: current.payment_hash,
      label: '',
      created_at: current.created_at
    };
    const payment = result[current.payment_hash];
    if (!multi) payment.id = current.id;

    if (current.payment_preimage) payment.payment_preimage = current.payment_preimage;
    if (current.bolt11) payment.bolt11 = current.bolt11;
    if (current.label) payment.label = current.label;
    if (current.destination) payment.destination = current.destination;
    const sent = current.status === 'complete' ? current.msatoshi_sent : 0;
    payment.msatoshi_sent = (payment.msatoshi_sent || 0) + sent;
    payment.msatoshi = (payment.msatoshi || 0) + (current.status === 'complete' ? current.msatoshi : 0);
    if (!multi && current.status === 'complete') payment.msatoshi_sent = current.msatoshi_sent;
    payment.created_at_str = (!payment.created_at) ? '' : common.convertTimestampToDate(payment.created_at);
    payment.status = payment.status === 'complete' ? payment.status : current.status;
    if (multi && current.status === 'complete') payment.parts = (payment.parts || 0) + 1;

    return result;
  }, {}));
}

exports.listPayments = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/pay/listPayments';
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
        body.payments = common.sortDescByKey(body.payments, 'created_at');
      }
      res.status(200).json(_groupPayments(body.payments));
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
  options.url = common.getSelLNServerUrl() + '/pay/decodePay/' + req.params.invoice;
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
  options.url = common.getSelLNServerUrl() + '/pay';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.info({fileName: 'Payments', msg: 'Payment Post Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Payments', lineNum: 81, msg: 'Payment Post Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Payment Post Failed!",
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
    logger.error({fileName: 'Payments', lineNum: 97, msg: 'Payments Post Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Payment Post Failed!",
      error: err.error
    });
  });
};

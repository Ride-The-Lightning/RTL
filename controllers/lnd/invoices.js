var request = require('request-promise');
var common = require('../../common');
var logger = require('../shared/logger');
var options = {};

exports.getInvoice = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/invoice/' + req.params.rHashStr;
  request(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Invoice Info Received: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Invoice', lineNum: 12, msg: 'Invoice Info Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Invoice Info Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    }
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
      delete err.options.headers['Grpc-Metadata-macaroon'];
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
      delete err.response.request.headers['Grpc-Metadata-macaroon'];
    }
    logger.error({fileName: 'Invoice', lineNum: 27, msg: 'Fetch Invoice Info Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Invoice Info Failed!",
      error: err.error
    });
  });  
};

exports.listInvoices = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/invoices?num_max_invoices=' + req.query.num_max_invoices + '&index_offset=' + req.query.index_offset + 
  '&reversed=' + req.query.reversed;
  request(options).then((body) => {
    const body_str = (!body) ? '' : JSON.stringify(body);
    const search_idx = (!body) ? -1 : body_str.search('Not Found');
    logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + body_str});
    if(!body || search_idx > -1 || body.error) {
      logger.error({fileName: 'Invoice', lineNum: 44, msg: 'List Invoices Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Fetching Invoice Info failed!",
        error: (!body || search_idx > -1) ? 'Error From Server!' : body.error
      });
    } else {
      if (body.invoices && body.invoices.length > 0) {
        body.invoices.forEach(invoice => {
          invoice.r_preimage = invoice.r_preimage ? Buffer.from(invoice.r_preimage, 'base64').toString('hex') : '';
          invoice.r_hash = invoice.r_hash ? Buffer.from(invoice.r_hash, 'base64').toString('hex') : '';
          invoice.description_hash = invoice.description_hash ? Buffer.from(invoice.description_hash, 'base64').toString('hex') : null;
          invoice.creation_date_str =  (!invoice.creation_date) ? '' : common.convertTimestampToDate(invoice.creation_date);
          invoice.settle_date_str =  (!invoice.settle_date || invoice.settle_date === '0') ? '' : common.convertTimestampToDate(invoice.settle_date);
          invoice.btc_value = (!invoice.value) ? 0 : common.convertToBTC(invoice.value);
          invoice.btc_amt_paid_sat =  (!invoice.amt_paid_sat) ? 0 : common.convertToBTC(invoice.amt_paid_sat);
          invoice.htlcs.forEach(htlc => {
            htlc.accept_time_str =  (!htlc.accept_time) ? '' : common.convertTimestampToDate(htlc.accept_time);
            htlc.resolve_time_str =  (!htlc.resolve_time) ? '' : common.convertTimestampToDate(htlc.resolve_time);
          });
        });
        body.invoices = common.sortDescByKey(body.invoices, 'creation_date');
      }
      logger.info({fileName: 'Invoice', msg: 'Invoices List Received: ' + JSON.stringify(body)});
      res.status(200).json(body);
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
    logger.error({fileName: 'Invoice', lineNum: 70, msg: 'List Invoice Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Fetching Invoices failed!",
      error: err.error
    });
  });
};

exports.addInvoice = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/invoices';
  options.form = { 
    memo: req.body.memo,
    private: req.body.private,
    expiry: req.body.expiry
  };
  if (req.body.amount > 0 && req.body.amount < 1) {
    options.form.value_msat = req.body.amount * 1000;
  } else {
    options.form.value = req.body.amount;
  }
  options.form = JSON.stringify(options.form);
  request.post(options).then((body) => {
    logger.info({fileName: 'Invoice', msg: 'Add Invoice Responce: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Invoice', lineNum: 95, msg: 'Add Invoice Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: "Add Invoice Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
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
    logger.error({fileName: 'Invoice', lineNum: 111, msg: 'Add Invoice Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Add Invoice Failed!",
      error: err.error
    });
  });
};

var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getLocalRemoteBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channel/localremotebal';
  request(options).then(function (body) {
    logger.info({fileName: 'Channels', msg: 'Local Remote Balance: ' + JSON.stringify(body)});
    if(undefined === body.localBalance) {
      body.localBalance = 0;
      body.btc_localBalance = 0;
    } else {
      body.btc_localBalance = common.convertToBTC(body.localBalance);
    }
    if(undefined === body.remoteBalance) {
      body.remoteBalance = 0;
      body.btc_remoteBalance = 0;
    } else {
      body.btc_remoteBalance = common.convertToBTC(body.remoteBalance);
    }

    res.status(200).json(body);
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 14, msg: 'Local Remote Balance: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Local Remote Balance Failed!',
      error: err.error
    });
  });
};

exports.forwardingHistory = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/switch';
  options.form = {};
  if (undefined !== req.body.num_max_events) {
    options.form.num_max_events = req.body.num_max_events;
  }
  if (undefined !== req.body.index_offset) {
    options.form.index_offset = req.body.index_offset;
  }
  if (undefined !== req.body.end_time) {
    options.form.end_time = req.body.end_time;
  }
  if (undefined !== req.body.start_time) {
    options.form.start_time = req.body.start_time;
  }
  options.form = JSON.stringify(options.form);
  logger.info({fileName: 'Switch', msg: 'Switch Post Options: ' + JSON.stringify(options)});
  request.post(options).then((body) => {
    logger.info({fileName: 'Switch', msg: 'Switch Post Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      logger.error({fileName: 'Switch', lineNum: 27, msg: 'Switch Post Erroe: ' + JSON.stringify((undefined === body) ? 'Error From Server!' : body.error)});
      res.status(500).json({
        message: "Switch post failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      if (undefined !== body.forwarding_events) {
        body.forwarding_events.forEach(event => {
          event.timestamp_str =  (undefined === event.timestamp) ? '' : common.convertTimestampToDate(event.timestamp);
        });
        body.forwarding_events = common.sortDescByKey(body.forwarding_events, 'timestamp');
      }
      logger.info({fileName: 'Switch', msg: 'Forwarding History Received: ' + JSON.stringify(body)});
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Switch', lineNum: 44, msg: 'Switch Post Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Switch post failed!",
      error: err.error
    });
  });
};


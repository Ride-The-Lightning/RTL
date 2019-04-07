var request = require('request-promise');
var common = require('../common');
var logger = require('./logger');
var options = {};

exports.forwardingHistory = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNDServerUrl() + '/switch';
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
  logger.info('\r\nSwitch: 14: ' + JSON.stringify(Date.now()) + ': INFO: Switch Post Options: ' + JSON.stringify(options));
  request.post(options).then((body) => {
    logger.info('\r\nSwitch: 16: ' + JSON.stringify(Date.now()) + ': INFO: Switch Post Response: ' + JSON.stringify(body));
    if(undefined === body || body.error) {
      logger.error('\r\nSwitch: 18: ' + JSON.stringify(Date.now()) + ': ERROR: Switch Post Erroe: ' + JSON.stringify((undefined === body) ? 'Error From Server!' : body.error));
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
      logger.info('\r\nSwitch: 38: ' + JSON.stringify(Date.now()) + ': INFO: Forwarding History Received: ' + JSON.stringify(body));
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error('\r\nSwitch: 28: ' + JSON.stringify(Date.now()) + ': ERROR: Switch Post Error: ' + JSON.stringify(err));
    return res.status(500).json({
      message: "Switch post failed!",
      error: err.error
    });
  });
};

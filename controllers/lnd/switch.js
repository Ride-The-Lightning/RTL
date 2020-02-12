var request = require('request-promise');
var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};
var num_max_events = 100;
var responseData = { forwarding_events: [], last_offset_index: 0 };

exports.forwardingHistory = (req, res, next) => {
  responseData = { forwarding_events: [], last_offset_index: 0 };
  this.getAllForwardingEvents(req.body.start_time, req.body.end_time, 0, (eventsResponse) => {
    if (eventsResponse.error) {
      res.status(500).json(eventsResponse);
    } else {
      if (eventsResponse.forwarding_events && eventsResponse.forwarding_events.length > 0) {
        eventsResponse.forwarding_events.forEach(event => {
          event.timestamp_str =  !event.timestamp ? '' : common.convertTimestampToDate(event.timestamp);
        });
        eventsResponse.forwarding_events = common.sortDescByKey(eventsResponse.forwarding_events, 'timestamp');
      }
      res.status(201).json(eventsResponse);
    }
  });
};

exports.getAllForwardingEvents = (start, end, offset, callback) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/switch';
  options.form = {};
  if (start) { options.form.start_time = start; }
  if (end) { options.form.end_time = end; }
  options.form.num_max_events = num_max_events;
  options.form.index_offset = offset;
  options.form = JSON.stringify(options.form);
  logger.info({fileName: 'Switch', msg: 'Forwarding History Params: ' + options.form});
  request.post(options).then((body) => { 
    logger.info({fileName: 'Switch', msg: 'Forwarding History: ' + JSON.stringify(body)});
    try {
      if (body.forwarding_events) { 
        console.warn('LENGTH: ' + body.forwarding_events.length);
        responseData.forwarding_events.push(...body.forwarding_events);
      }
      if (!body.last_offset_index || body.last_offset_index < offset + num_max_events) {
        responseData.last_offset_index = body.last_offset_index ? body.last_offset_index : 0
        callback(responseData);
      } else {
        this.getAllForwardingEvents(start, end, offset + num_max_events, callback);
      }    
    } catch(err) {
      console.warn(err);
    }
  }).catch(err => {
    logger.error({fileName: 'Switch', lineNum: 32, msg: 'Get All Forwarding Events Failed: ' + JSON.stringify(err)});
    callback({
      message: "Forwarding Events Failed!",
      error: err.error
    });
  });  
}

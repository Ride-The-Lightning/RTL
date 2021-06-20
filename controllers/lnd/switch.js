var request = require('request-promise');
var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};
var num_max_events = 100;
var responseData = { forwarding_events: [], last_offset_index: 0 };

exports.forwardingHistory = (req, res, next) => {
  return this.getAllForwardingEvents(req.body.start_time, req.body.end_time, 0, (eventsResponse) => {
    if (eventsResponse.error) {
      res.status(500).json(eventsResponse);
    } else {
      res.status(201).json(eventsResponse);
    }
  });
};

exports.getAllForwardingEvents = (start, end, offset, callback) => {
  logger.log({level: 'INFO', fileName: 'Switch', msg: 'Getting Forwarding Events...'});
  if (offset === 0) { responseData = { forwarding_events: [], last_offset_index: 0 }; }
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/switch';
  options.form = {};
  if (start) { options.form.start_time = start; }
  if (end) { options.form.end_time = end; }
  options.form.num_max_events = num_max_events;
  options.form.index_offset = offset;
  options.form = JSON.stringify(options.form);
  logger.log({level: 'DEBUG', fileName: 'Switch', msg: 'Forwarding History Params: ' + options.form});
  return request.post(options).then((body) => { 
    logger.log({level: 'DEBUG', fileName: 'Switch', msg: 'Forwarding History: ' + JSON.stringify(body)});
    logger.log({level: 'INFO', fileName: 'Switch', msg: 'Forwarding Events Received.'});
    if (body.forwarding_events) { 
      responseData.forwarding_events.push(...body.forwarding_events);
    }
    if (!body.last_offset_index || body.last_offset_index < offset + num_max_events) {
      responseData.last_offset_index = body.last_offset_index ? body.last_offset_index : 0
      if (responseData.forwarding_events) { 
        responseData.forwarding_events = common.sortDescByKey(responseData.forwarding_events, 'timestamp');
      }
      return callback(responseData);
    } else {
      return this.getAllForwardingEvents(start, end, offset + num_max_events, callback);
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
    logger.log({level: 'ERROR', fileName: 'Switch', msg: 'Get All Forwarding Events Error: ' + JSON.stringify(err)});
    return callback({
      message: "Forwarding Events Failed!",
      error: err.error
    });
  });  
}

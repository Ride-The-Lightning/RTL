import * as request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger';
import { Common, CommonService } from '../../utils/common';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
let responseData = { forwarding_events: [], last_offset_index: 0 };
const num_max_events = 100;

export const forwardingHistory = (req, res, next) => {
  getAllForwardingEvents(req.body.start_time, req.body.end_time, 0, (eventsResponse) => {
    if (eventsResponse.error) {
      res.status(eventsResponse.error.statusCode).json(eventsResponse);
    } else {
      res.status(201).json(eventsResponse);
    }
  });
};

export const getAllForwardingEvents = (start, end, offset, callback) => {
  logger.log({ level: 'INFO', fileName: 'Switch', msg: 'Getting Forwarding Events..' });
  if (offset === 0) { responseData = { forwarding_events: [], last_offset_index: 0 }; }
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/switch';
  options.form = {};
  if (start) { options.form.start_time = start; }
  if (end) { options.form.end_time = end; }
  options.form.num_max_events = num_max_events;
  options.form.index_offset = offset;
  options.form = JSON.stringify(options.form);
  logger.log({ level: 'DEBUG', fileName: 'Switch', msg: 'Forwarding History Params', data: options.form });
  return request.post(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Switch', msg: 'Forwarding History', data: body });
    logger.log({ level: 'INFO', fileName: 'Switch', msg: 'Forwarding Events Received' });
    if (body.forwarding_events) {
      responseData.forwarding_events.push(...body.forwarding_events);
    }
    if (!body.last_offset_index || body.last_offset_index < offset + num_max_events) {
      responseData.last_offset_index = body.last_offset_index ? body.last_offset_index : 0;
      if (responseData.forwarding_events) {
        responseData.forwarding_events = common.sortDescByKey(responseData.forwarding_events, 'timestamp');
      }
      return callback(responseData);
    } else {
      return getAllForwardingEvents(start, end, offset + num_max_events, callback);
    }
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Switch', 'Get All Forwarding Events Error');
    return callback({ message: err.message, error: err.error, statusCode: err.statusCode });
  });
};

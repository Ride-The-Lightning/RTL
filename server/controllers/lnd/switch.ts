import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
let responseData = { forwarding_events: [], last_offset_index: 0 };
const num_max_events = 100;

export const forwardingHistory = (req, res, next) => {
  getAllForwardingEvents(req, req.body.start_time, req.body.end_time, 0, (eventsResponse) => {
    if (eventsResponse.error) {
      res.status(eventsResponse.error.statusCode).json(eventsResponse);
    } else {
      res.status(201).json(eventsResponse);
    }
  });
};

export const getAllForwardingEvents = (req, start, end, offset, callback) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Switch', msg: 'Getting Forwarding Events..' });
  if (offset === 0) { responseData = { forwarding_events: [], last_offset_index: 0 }; }
  if (!req.session.selectedNode) {
    const err = common.handleError({ message: 'Session Expired after a day\'s inactivity.', statusCode: 401 }, 'Balance', 'Get Balance Error', req.session.selectedNode);
    return callback({ message: err.message, error: err.error, statusCode: err.statusCode });
  } options = common.getOptions(req);
  options.url = req.session.selectedNode.ln_server_url + '/v1/switch';
  options.form = {};
  if (start) { options.form.start_time = start; }
  if (end) { options.form.end_time = end; }
  options.form.num_max_events = num_max_events;
  options.form.index_offset = offset;
  options.form = JSON.stringify(options.form);
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Switch', msg: 'Forwarding History Params', data: options.form });
  return request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Switch', msg: 'Forwarding History', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Switch', msg: 'Forwarding Events Received' });
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
      return getAllForwardingEvents(req, start, end, offset + num_max_events, callback);
    }
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Switch', 'Get All Forwarding Events Error', req.session.selectedNode);
    return callback({ message: err.message, error: err.error, statusCode: err.statusCode });
  });
};

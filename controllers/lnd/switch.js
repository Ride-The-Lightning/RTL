var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getAllForwardingEvents = (start, end, offset, max_events) => {
  return new Promise(function(resolve, reject) {
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/switch';
    options.form = {};
    if (start) { options.form.start_time = start; }
    if (end) { options.form.end_time = end; }
    options.form.num_max_events = max_events ? max_events : 1000;
    options.form.index_offset = offset ? offset : 0;
    options.form = JSON.stringify(options.form);
    logger.info({fileName: 'Switch', msg: 'Forwarding History Params: ' + options.form});
    request.post(options).then((body) => {
      if(undefined === body || body.error) {
        logger.error({fileName: 'Switch', lineNum: 31, msg: 'Forwarding History Error: ' + JSON.stringify((undefined === body) ? 'Error From Server!' : body.error)});
        res.status(500).json({
          message: "Switch post failed!",
          error: (undefined === body) ? 'Error From Server!' : body.error
        });
      } else {
        logger.info({fileName: 'Switch', msg: 'Forwarding History Received: ' + JSON.stringify(body)});
        if (body.forwarding_events && body.forwarding_events.length > 0) {
          body.forwarding_events.forEach(event => {
            event.timestamp_str =  (undefined === event.timestamp) ? '' : common.convertTimestampToDate(event.timestamp);
          });
          body.forwarding_events = common.sortDescByKey(body.forwarding_events, 'timestamp');
        }
        logger.info({fileName: 'Switch', msg: 'Forwarding History before Resolve: ' + JSON.stringify(body)});
        resolve(body);
      }
    })
    .catch(function (err) {
      logger.error({fileName: 'Switch', lineNum: 48, msg: 'Forwarding History Error: ' + JSON.stringify(err)});
      resolve({
        message: "Switch post failed!",
        error: err.error
      });
    });
  });
}

exports.forwardingHistory = (req, res, next) => {
  this.getAllForwardingEvents(req.body.start_time, req.body.end_time, 0, 1000).then(function(values) {
    logger.info({fileName: 'Switch', msg: 'All Forwarding Events: ' + JSON.stringify(values)});
    res.status(201).json(values);
  }).catch(err => {
    logger.error({fileName: 'Switch', lineNum: 60, msg: 'Get All Forwarding Events: ' + JSON.stringify(err)});
    res.status(500).json({
      message: "Switch post failed!",
      error: err.error
    });
  });  
};








// var request = require('request-promise');
// var common = require('../../common');
// var logger = require('../logger');
// var options = {};
// var num_max_events = 10;

// exports.fetchPaginatedEvents = (start, end, offset, results2, callback) => {
//   options = common.getOptions();
//   options.url = common.getSelLNServerUrl() + '/switch';
//   options.form = {};
//   if (start) { options.form.start_time = start; }
//   if (end) { options.form.end_time = end; }
//   options.form.num_max_events = num_max_events;
//   options.form.index_offset = offset ? offset : 0;
//   options.form = JSON.stringify(options.form);
//   logger.info({fileName: 'Switch', msg: 'Forwarding History Params: ' + options.form});
//   return request.post(options).then((body) => {
//     logger.info({fileName: 'Switch', msg: 'Forwarding History Received: ' + JSON.stringify(body)});
//     if(undefined === body || body.error) {
//       logger.error({fileName: 'Switch', lineNum: 31, msg: 'Forwarding History Error: ' + JSON.stringify((undefined === body) ? 'Error From Server!' : body.error)});
//       res.status(500).json({
//         message: "Switch post failed!",
//         error: (undefined === body) ? 'Error From Server!' : body.error
//       });
//     } else {
//       if (undefined !== body.forwarding_events && body.forwarding_events.length > 0) {
//         body.forwarding_events.forEach(event => {
//           event.timestamp_str =  (undefined === event.timestamp) ? '' : common.convertTimestampToDate(event.timestamp);
//         });
//         body.forwarding_events = common.sortDescByKey(body.forwarding_events, 'timestamp');
//       }
//       logger.info({fileName: 'Switch', msg: 'Forwarding History Before Resolve: ' + JSON.stringify(body)});
//       if (body.last_offset_index >= (offset+num_max_events)) {
//         // console.log('INSIDE CALLBACK');
//         // console.log(results);
//         // results.push(body)
//         callback(results2);
//       }
//       console.log('INSIDE RESOLVE');
//       // console.log(body);
//       console.log(results2);
//       body.forwarding_events.forEach(event => {
//         results2.push(results2);
//       });
//       console.log(results2);
//       return results2;
//     }
//   }).catch(err => err);
// }

// exports.getAllForwardingEvents = (start, end, offset, results1) => {
//   var self = this;
//   return new Promise((resolve, reject) => {
//     resolve(self.fetchPaginatedEvents(start, end, offset, results1, function(results1) { self.getAllForwardingEvents(start, end, offset + num_max_events, results1)}));
//   });
// }

// exports.forwardingHistory = (req, res, next) => {
//   var results = [];
//   this.getAllForwardingEvents(req.body.start_time, req.body.end_time, 0, results)
//   .then(values => {
//     console.log('VALUES: ');
//     console.log(values);
//     logger.info({fileName: 'Switch', msg: 'All Forwarding Events: ' + JSON.stringify(values)});
//     res.status(201).json(values);
//   }).catch(err => {
//     logger.error({fileName: 'Switch', lineNum: 60, msg: 'Get All Forwarding Events: ' + JSON.stringify(err)});
//     res.status(500).json({
//       message: "Switch post failed!",
//       error: err.error
//     });
//   });  
// };

var request = require('request-promise');
var common = require('../../utils/common');
var logger = require('../../utils/logger');
var options = {};

exports.getNodes = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Network', msg: 'Node Lookup..'});
  options = common.getOptions();  
  options.url = common.getSelLNServerUrl() + '/nodes';
  options.form = { nodeIds: req.params.id };
  request.post(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Network', msg: 'Node Lookup', data: body});
    logger.log({level: 'INFO', fileName: 'Network', msg: 'Node Lookup Finished'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Network', 'Node Lookup Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
};

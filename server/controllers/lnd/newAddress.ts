import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getNewAddress = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'NewAddress', msg: 'Getting New Address..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/newaddress?type=' + req.query.type;
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'NewAddress', msg: 'New Address Generated', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'NewAddress', 'New Address Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

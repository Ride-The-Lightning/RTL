import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getNewAddress = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'NewAddress', msg: 'Getting New Address..' });
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/newaddress?type=' + req.query.type;
  request(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'NewAddress', msg: 'New Address Received', data: body });
    logger.log({ level: 'INFO', fileName: 'NewAddress', msg: 'New Address Received' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'NewAddress', 'New Address Error');
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

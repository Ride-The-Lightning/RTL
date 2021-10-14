import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getFees = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'Fees', msg: 'Getting Fees..' });
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/getFees';
  request(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Fees', msg: 'Fee Received', data: body });
    if (!body.feeCollected) { body.feeCollected = 0; }
    logger.log({ level: 'INFO', fileName: 'Fees', msg: 'Fees Received' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Fees', 'Get Fees Error');
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

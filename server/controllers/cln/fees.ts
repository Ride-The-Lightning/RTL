import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getFees = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Fees', msg: 'Getting Fees..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/getinfo';
  request.post(options).then((body) => {
    const versionCompatible = common.isVersionCompatible('23.02');
    const feeData = { feeCollected: ((versionCompatible ? body.fees_collected_msat : body.msatoshi_fees_collected) || 0) };
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Fees', msg: 'Fee Received', data: feeData });
    res.status(200).json(feeData);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Fees', 'Get Fees Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

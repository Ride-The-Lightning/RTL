import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getBalance = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Balance', msg: 'Getting Balance..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listfunds';
  request.post(options).then((body) => {
    let confBalance = 0;
    let unconfBalance = 0;
    let totalBalance = 0;
    const versionCompatible = common.isVersionCompatible(req.session.selectedNode.ln_version, '23.02');
    body.outputs.forEach((output) => {
      if (output.status === 'confirmed') {
        confBalance = confBalance + (versionCompatible ? (output.amount_msat / 1000) : output.value);
      } else if (output.status === 'unconfirmed') {
        unconfBalance = unconfBalance + (versionCompatible ? (output.amount_msat / 1000) : output.value);
      }
    });
    totalBalance = confBalance + unconfBalance;
    const walBalance = { totalBalance: totalBalance || 0, confBalance: confBalance || 0, unconfBalance: unconfBalance || 0 };
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Balance', msg: 'Balance Received', data: walBalance });
    res.status(200).json(walBalance);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Balance', 'Get Balance Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

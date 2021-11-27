import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getInfo = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Getting Eclair Node Information..' });
  common.logEnvVariables(req);
  common.setOptions(req);
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/getinfo';
  options.form = {};
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'GetInfo', msg: 'Selected Node', data: req.session.selectedNode.ln_node });
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'GetInfo', msg: 'Calling Info from Eclair server url', data: options.url });
  if (common.read_dummy_data) {
    common.getDummyData('GetInfo', req.session.selectedNode.ln_implementation).then((data: any) => {
      data.lnImplementation = 'Eclair';
      res.status(200).json(data);
    });
  } else {
    if (!options.headers || !options.headers.authorization) {
      const errMsg = 'Eclair Get info failed due to missing or wrong password!';
      const err = common.handleError({ statusCode: 502, message: 'Missing or Wrong Password', error: errMsg }, 'GetInfo', errMsg, req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    } else {
      request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Connecting to the Eclair\'s Websocket Server.' });
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'GetInfo', msg: 'Get Info Response', data: body });
        body.lnImplementation = 'Eclair';
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Eclair Node Information Received' });
        req.session.selectedNode.ln_version = body.version.split('-')[0] || '';
        res.status(200).json(body);
      }).
        catch((errRes) => {
          const err = common.handleError(errRes, 'GetInfo', 'Get Info Error', req);
          return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
  }
};

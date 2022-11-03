import request from 'request-promise';
import { Database, DatabaseService } from '../../utils/database.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { ECLWSClient, ECLWebSocketClient } from './webSocketClient.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
const eclWsClient: ECLWebSocketClient = ECLWSClient;
const databaseService: DatabaseService = Database;

export const getInfo = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Getting Eclair Node Information..' });
  common.logEnvVariables(req);
  common.setOptions(req);
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/getinfo';
  options.form = {};
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Selected Node ' + req.session.selectedNode.ln_node });
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Calling Info from Eclair server url ' + options.url });
  if (common.read_dummy_data) {
    common.getDummyData('GetInfo', req.session.selectedNode.ln_implementation).then((data: any) => {
      data.lnImplementation = 'Eclair';
      return res.status(200).json(data);
    });
  } else {
    if (!options.headers || !options.headers.authorization) {
      const errMsg = 'Eclair Get info failed due to missing or wrong password!';
      const err = common.handleError({ statusCode: 502, message: 'Missing or Wrong Password', error: errMsg }, 'GetInfo', errMsg, req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    } else {
      return request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Connecting to the Eclair\'s Websocket Server.' });
        body.lnImplementation = 'Eclair';
        req.session.selectedNode.ln_version = body.version.split('-')[0] || '';
        eclWsClient.updateSelectedNode(req.session.selectedNode);
        databaseService.loadDatabase(req.session);
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Node Information Received', data: body });
        return res.status(200).json(body);
      }).catch((errRes) => {
        const err = common.handleError(errRes, 'GetInfo', 'Get Info Error', req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
    }
  }
};

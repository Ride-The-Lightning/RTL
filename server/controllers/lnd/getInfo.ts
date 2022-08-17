import request from 'request-promise';
import { Database, DatabaseService } from '../../utils/database.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { LNDWSClient, LNDWebSocketClient } from './webSocketClient.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
const lndWsClient: LNDWebSocketClient = LNDWSClient;
const databaseService: DatabaseService = Database;

export const getInfo = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Getting LND Node Information..' });
  common.logEnvVariables(req);
  common.setOptions(req);
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/getinfo';
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Selected Node ' + req.session.selectedNode.ln_node });
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Calling Info from LND server url ' + options.url });
  if (!options.headers || !options.headers['Grpc-Metadata-macaroon']) {
    const errMsg = 'LND Get info failed due to bad or missing macaroon! Please check RTL-Config.json to verify the setup!';
    const err = common.handleError({ statusCode: 502, message: 'Bad or Missing Macaroon', error: errMsg }, 'GetInfo', errMsg, req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  } else {
    common.nodes?.map((node: any) => {
      if (node.ln_implementation === 'LND') {
        common.getAllNodeAllChannelBackup(node);
      }
      return node;
    });
    return request(options).then((body) => {
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if (!body || search_idx > -1 || body.error) {
        if (body && !body.error) { body.error = 'Error From Server!'; }
        const err = common.handleError(body, 'GetInfo', 'Get Info Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      } else {
        req.session.selectedNode.ln_version = body.version.split('-')[0] || '';
        lndWsClient.updateSelectedNode(req.session.selectedNode);
        databaseService.loadDatabase(req.session.selectedNode);
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Node Information Received', data: body });
        return res.status(200).json(body);
      }
    }).catch((errRes) => {
      const err = common.handleError(errRes, 'GetInfo', 'Get Info Error', req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
  }
};

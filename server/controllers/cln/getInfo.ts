import request from 'request-promise';
import { Database, DatabaseService } from '../../utils/database.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { CLWSClient, CLWebSocketClient } from './webSocketClient.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
const clWsClient: CLWebSocketClient = CLWSClient;
const databaseService: DatabaseService = Database;

export const getInfo = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Getting Core Lightning Node Information..' });
  common.logEnvVariables(req);
  common.setOptions(req);
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/getinfo';
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Selected Node ' + req.session.selectedNode.ln_node });
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Calling Info from Core Lightning server url ' + options.url });
  if (!options.headers || !options.headers.macaroon) {
    const errMsg = 'Core lightning get info failed due to bad or missing macaroon!';
    const err = common.handleError({ statusCode: 502, message: 'Bad Macaroon', error: errMsg }, 'GetInfo', errMsg, req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  } else {
    return request(options).then((body) => {
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if (!body || search_idx > -1 || body.error) {
        if (body && !body.error) { body.error = 'Error From Server!'; }
        const err = common.handleError(body, 'GetInfo', 'Get Info Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      } else {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'GetInfo', msg: 'Node Information Before Update', data: body });
        body.lnImplementation = 'Core Lightning';
        const chainObj = { chain: '', network: '' };
        if (body.network.includes('litecoin') || body.network.includes('feathercoin')) {
          chainObj.chain = '';
          chainObj.network = '';
        } else if (body.network.includes('liquid')) {
          chainObj.chain = 'Liquid';
          chainObj.network = common.titleCase(body.network);
        } else {
          chainObj.chain = 'Bitcoin';
          chainObj.network = common.titleCase(body.network);
        }
        body.chains = [chainObj];
        body.uris = [];
        if (body.address && body.address.length > 0) {
          body.address.forEach((addr) => {
            body.uris.push(body.id + '@' + addr.address + ':' + addr.port);
          });
        }
        req.session.selectedNode.api_version = body.api_version || '';
        req.session.selectedNode.ln_version = body.version || '';
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Connecting to the Core Lightning\'s Websocket Server.' });
        clWsClient.updateSelectedNode(req.session.selectedNode);
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

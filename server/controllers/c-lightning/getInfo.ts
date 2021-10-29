import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getInfo = (req, res, next) => {
  common.logEnvVariables(req);
  logger.log({ level: 'INFO', fileName: 'GetInfo', msg: 'Getting CLightning Node Information..' });
  common.setOptions(req);
  options = common.getOptions(req);
  options.url = req.session.selectedNode.ln_server_url + '/v1/getinfo';
  logger.log({ level: 'DEBUG', fileName: 'GetInfo', msg: 'Selected Node', data: req.session.selectedNode.ln_node });
  logger.log({ level: 'DEBUG', fileName: 'GetInfo', msg: 'Calling Info from C-Lightning server url', data: options.url });
  if (!options.headers || !options.headers.macaroon) {
    const errMsg = 'C-Lightning get info failed due to bad or missing macaroon!';
    const err = common.handleError({ statusCode: 502, message: 'Bad Macaroon', error: errMsg }, 'GetInfo', errMsg, req);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  } else {
    request(options).then((body) => {
      logger.log({ level: 'DEBUG', fileName: 'GetInfo', msg: 'Node Information', data: body });
      const body_str = (!body) ? '' : JSON.stringify(body);
      const search_idx = (!body) ? -1 : body_str.search('Not Found');
      if (!body || search_idx > -1 || body.error) {
        if (body && !body.error) { body.error = 'Error From Server!'; }
        const err = common.handleError(body, 'GetInfo', 'Get Info Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      } else {
        body.lnImplementation = 'C-Lightning';
        const chainObj = { chain: '', network: '' };
        if (body.network === 'testnet') {
          chainObj.chain = 'Bitcoin';
          chainObj.network = 'Testnet';
        } else if (body.network === 'bitcoin') {
          chainObj.chain = 'Bitcoin';
          chainObj.network = 'Mainnet';
        } else if (body.network === 'litecoin') {
          chainObj.chain = 'Litecoin';
          chainObj.network = 'Mainnet';
        } else if (body.network === 'litecoin-testnet') {
          chainObj.chain = 'Litecoin';
          chainObj.network = 'Testnet';
        }
        body.chains = [chainObj];
        body.uris = [];
        if (body.address && body.address.length > 0) {
          body.address.forEach((addr) => {
            body.uris.push(body.id + '@' + addr.address + ':' + addr.port);
          });
        }
        logger.log({ level: 'INFO', fileName: 'GetInfo', msg: 'CLightning Node Information Received' });
        res.status(200).json(body);
      }
    }).catch((errRes) => {
      const err = common.handleError(errRes, 'GetInfo', 'Get Info Error', req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
  }
};

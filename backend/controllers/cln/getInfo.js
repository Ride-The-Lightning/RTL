import axios from 'axios';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { CLWSClient } from './webSocketClient.js';
const logger = Logger;
const common = Common;
const clWsClient = CLWSClient;
export const getInfo = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Getting Core Lightning Node Information..' });
    common.logEnvVariables(req);
    common.setAxiosConfig(req);
    const axiosConfig = common.getAxiosConfig(req);
    const url = req.session.selectedNode.settings.lnServerUrl + '/v1/getinfo';
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Selected Node ' + req.session.selectedNode.lnNode });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Calling Info from Core Lightning server url ' + url });
    if (!axiosConfig.headers || !axiosConfig.headers?.rune) {
        const errMsg = 'Core lightning get info failed due to missing rune!';
        const err = common.handleError({ statusCode: 502, message: 'Bad rune', error: errMsg }, 'GetInfo', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    else {
        return axios.post(url, null, axiosConfig).then((body) => {
            body = body.data;
            body = body.data;
            body = body.data;
            body = body.data;
            body = body.data;
            logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'GetInfo', msg: 'Node Information Before Update', data: body });
            body.lnImplementation = 'Core Lightning';
            const chainObj = { chain: '', network: '' };
            if (body.network.includes('litecoin') || body.network.includes('feathercoin')) {
                chainObj.chain = '';
                chainObj.network = '';
            }
            else if (body.network.includes('liquid')) {
                chainObj.chain = 'Liquid';
                chainObj.network = common.titleCase(body.network);
            }
            else {
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
            req.session.selectedNode.lnVersion = body.version || '';
            req.session.selectedNode.api_version = body.api_version || '';
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Connecting to the Core Lightning\'s Websocket Server.' });
            clWsClient.updateSelectedNode(req.session.selectedNode);
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'GetInfo', msg: 'Node Information Received', data: body });
            return res.status(200).json(body);
        }).catch((errRes) => {
            const err = common.handleError(errRes, 'GetInfo', 'Get Info Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
};

import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { ECLWSClient } from './webSocketClient.js';
let options = null;
const logger = Logger;
const common = Common;
const eclWsClient = ECLWSClient;
export const getInfo = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'GetInfo', msg: 'Getting Eclair Node Information..' });
    common.setOptions();
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/getinfo';
    options.form = {};
    logger.log({ level: 'DEBUG', fileName: 'GetInfo', msg: 'Selected Node', data: common.selectedNode.ln_node });
    logger.log({ level: 'DEBUG', fileName: 'GetInfo', msg: 'Calling Info from Eclair server url', data: options.url });
    if (common.read_dummy_data) {
        common.getDummyData('GetInfo').then((data) => {
            data.lnImplementation = 'Eclair';
            res.status(200).json(data);
        });
    }
    else {
        if (!options.headers || !options.headers.authorization) {
            const errMsg = 'Eclair Get info failed due to missing or wrong password!';
            const err = common.handleError({ statusCode: 502, message: 'Missing or Wrong Password', error: errMsg }, 'GetInfo', errMsg);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
        else {
            request.post(options).then((body) => {
                logger.log({ level: 'INFO', fileName: 'GetInfo', msg: 'Connecting to the Eclair\'s Websocket Server.' });
                logger.log({ level: 'DEBUG', fileName: 'GetInfo', msg: 'Get Info Response', data: body });
                body.lnImplementation = 'Eclair';
                logger.log({ level: 'INFO', fileName: 'GetInfo', msg: 'Eclair Node Information Received' });
                res.status(200).json(body);
            }).
                catch((errRes) => {
                const err = common.handleError(errRes, 'GetInfo', 'Get Info Error');
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            });
        }
    }
};

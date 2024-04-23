import jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { sep } from 'path';
import ini from 'ini';
import parseHocon from 'hocon-parser';
import request from 'request-promise';
import { Database } from '../../utils/database.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
import { Authentication, SSO } from '../../models/config.model.js';
const options = { url: '' };
const logger = Logger;
const common = Common;
const wsServer = WSServer;
const databaseService = Database;
export const maskPasswords = (obj) => {
    const keys = Object.keys(obj);
    const length = keys.length;
    if (length !== 0) {
        for (let i = 0; i < length; i++) {
            if (typeof obj[keys[i]] === 'object') {
                keys[keys[i]] = maskPasswords(obj[keys[i]]);
            }
            if (typeof keys[i] === 'string' &&
                ((keys[i].toLowerCase().includes('password') && keys[i] !== 'allowPasswordUpdate') || keys[i].toLowerCase().includes('multipass') ||
                    keys[i].toLowerCase().includes('rpcpass') || keys[i].toLowerCase().includes('rpcpassword') ||
                    keys[i].toLowerCase().includes('rpcuser'))) {
                obj[keys[i]] = '*'.repeat(20);
            }
        }
    }
    return obj;
};
export const removeSecureData = (config) => {
    delete config.rtlConfFilePath;
    delete config.rtlPass;
    delete config.multiPass;
    delete config.multiPassHashed;
    delete config.secret2FA;
    config.nodes.map((node) => {
        delete node.authentication.macaroonPath;
        delete node.authentication.runePath;
        delete node.authentication.lnApiPassword;
        return node;
    });
    return config;
};
export const addSecureData = (config) => {
    config.rtlConfFilePath = common.appConfig.rtlConfFilePath;
    config.rtlPass = common.appConfig.rtlPass;
    config.multiPassHashed = common.appConfig.multiPassHashed;
    config.SSO.rtlCookiePath = common.appConfig.SSO.rtlCookiePath;
    if (common.appConfig.multiPass) {
        config.multiPass = common.appConfig.multiPass;
    }
    if (config.secret2FA === common.appConfig.secret2FA) {
        config.secret2FA = common.appConfig.secret2FA;
    }
    config.nodes.map((node, i) => {
        if (common.appConfig && common.appConfig.nodes && common.appConfig.nodes.length > i && common.appConfig.nodes[i].authentication && common.appConfig.nodes[i].authentication.macaroonPath) {
            node.authentication.macaroonPath = common.appConfig.nodes[i].authentication.macaroonPath;
        }
        if (common.appConfig && common.appConfig.nodes && common.appConfig.nodes.length > i && common.appConfig.nodes[i].authentication && common.appConfig.nodes[i].authentication.runePath) {
            node.authentication.runePath = common.appConfig.nodes[i].authentication.runePath;
        }
        if (common.appConfig && common.appConfig.nodes && common.appConfig.nodes.length > i && common.appConfig.nodes[i].authentication && common.appConfig.nodes[i].authentication.lnApiPassword) {
            node.authentication.lnApiPassword = common.appConfig.nodes[i].authentication.lnApiPassword;
        }
        return node;
    });
    return config;
};
export const getCurrencyRates = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Getting Currency Rates..' });
    options.url = 'https://blockchain.info/ticker';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Currency Rates Received', data: body });
        res.status(200).json(JSON.parse(body));
    }).catch((errRes) => {
        const errMsg = 'Get Rates Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    });
};
export const getFile = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Getting File..' });
    const file = req.query.path ? req.query.path : (req.session.selectedNode.settings.channelBackupPath + sep + 'channel-' + req.query.channel?.replace(':', '-') + '.bak');
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'RTLConf', msg: 'Channel Point', data: req.query.channel });
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'RTLConf', msg: 'File Path', data: file });
    fs.readFile(file, 'utf8', (errRes, data) => {
        if (errRes) {
            if (errRes.code && errRes.code === 'ENOENT') {
                errRes.code = 'File Not Found!';
            }
            const errMsg = 'Reading File Error';
            const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        }
        else {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'File Data Received', data: data });
            res.status(200).json(data);
        }
    });
};
export const getApplicationSettings = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Getting RTL Configuration..' });
    const confFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    fs.readFile(confFile, 'utf8', (errRes, data) => {
        if (errRes) {
            const errMsg = 'Get Node Config Error';
            const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        }
        else {
            const appConfData = removeSecureData(JSON.parse(data));
            appConfData.allowPasswordUpdate = common.appConfig.allowPasswordUpdate;
            appConfData.enable2FA = common.appConfig.enable2FA;
            appConfData.selectedNodeIndex = (req.session.selectedNode && req.session.selectedNode.index ? req.session.selectedNode.index : common.selectedNode.index);
            common.appConfig.selectedNodeIndex = appConfData.selectedNodeIndex;
            const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
            jwt.verify(token, common.secret_key, (err, user) => {
                if (err) {
                    // Delete unnecessary data for initial response (without security token)
                    const selNodeIdx = appConfData.nodes.findIndex((node) => node.index === appConfData.selectedNodeIndex) || 0;
                    appConfData.SSO = new SSO();
                    appConfData.secret2FA = '';
                    appConfData.dbDirectoryPath = '';
                    appConfData.nodes[selNodeIdx].authentication = new Authentication();
                    delete appConfData.nodes[selNodeIdx].settings.bitcoindConfigPath;
                    delete appConfData.nodes[selNodeIdx].settings.lnServerUrl;
                    delete appConfData.nodes[selNodeIdx].settings.swapServerUrl;
                    delete appConfData.nodes[selNodeIdx].settings.boltzServerUrl;
                    delete appConfData.nodes[selNodeIdx].settings.enableOffers;
                    delete appConfData.nodes[selNodeIdx].settings.enablePeerswap;
                    delete appConfData.nodes[selNodeIdx].settings.channelBackupPath;
                    appConfData.nodes = [appConfData.nodes[selNodeIdx]];
                }
                logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'RTL Configuration Received', data: appConfData });
                res.status(200).json(appConfData);
            });
        }
    });
};
export const updateSelectedNode = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating Selected Node..' });
    const selNodeIndex = req.params.currNodeIndex ? +req.params.currNodeIndex : common.selectedNode ? +common.selectedNode.index : 1;
    req.session.selectedNode = common.findNode(selNodeIndex);
    if (req.headers && req.headers.authorization && req.headers.authorization !== '') {
        wsServer.updateLNWSClientDetails(req.session.id, +req.session.selectedNode.index, +req.params.prevNodeIndex);
        if (req.params.prevNodeIndex !== '-1') {
            databaseService.unloadDatabase(req.params.prevNodeIndex, req.session.id);
        }
        if (req.params.currNodeIndex !== '-1') {
            databaseService.loadDatabase(req.session);
        }
    }
    const responseVal = !req.session.selectedNode.lnNode ? '' : req.session.selectedNode.lnNode;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Selected Node Updated To ' + responseVal });
    res.status(200).json({ status: 'Selected Node Updated To: ' + JSON.stringify(responseVal) + '!' });
};
export const getConfig = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Reading Configuration File..' });
    let confFile = '';
    let fileFormat = 'INI';
    switch (req.params.nodeType) {
        case 'ln':
            confFile = req.session.selectedNode.authentication.configPath;
            break;
        case 'bitcoind':
            confFile = req.session.selectedNode.settings.bitcoindConfigPath;
            break;
        case 'rtl':
            fileFormat = 'JSON';
            confFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
            break;
        default:
            confFile = '';
            break;
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'RTLConf', msg: 'Node Type', data: req.params.nodeType });
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'RTLConf', msg: 'File Path', data: confFile });
    fs.readFile(confFile, 'utf8', (errRes, data) => {
        if (errRes) {
            const errMsg = 'Reading Config Error';
            const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        }
        else {
            let jsonConfig = {};
            if (fileFormat === 'JSON') {
                jsonConfig = JSON.parse(data);
            }
            else {
                fileFormat = 'INI';
                data = data?.replace('color=#', 'color=');
                jsonConfig = ini.parse(data);
                if (jsonConfig['Application Options'] && jsonConfig['Application Options'].color) {
                    jsonConfig['Application Options'].color = '#' + jsonConfig['Application Options'].color;
                }
                if (req.params.nodeType === 'ln' && req.session.selectedNode.lnImplementation === 'ECL' && !jsonConfig['eclair.api.password']) {
                    fileFormat = 'HOCON';
                    jsonConfig = parseHocon(data);
                }
            }
            jsonConfig = maskPasswords(jsonConfig);
            const responseJSON = (fileFormat === 'JSON') ? jsonConfig : ini.stringify(jsonConfig)?.replace('color=\\#', 'color=#');
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Configuration File Data Received', data: responseJSON });
            res.status(200).json({ format: fileFormat, data: responseJSON });
        }
    });
};
export const updateNodeSettings = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating Node Settings..' });
    const RTLConfFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    const node = config.nodes.find((node) => (node.index === req.session.selectedNode.index));
    if (node && node.settings) {
        node.settings = req.body;
    }
    try {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        const selectedNode = common.findNode(req.session.selectedNode.index);
        if (selectedNode && selectedNode.settings) {
            selectedNode.settings = req.body;
            common.replaceNode(req, selectedNode);
        }
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Node Settings Updated', data: maskPasswords(config) });
        res.status(201).json({ message: 'Node Settings Updated Successfully' });
    }
    catch (errRes) {
        const errMsg = 'Update Node Settings Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};
export const updateApplicationSettings = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating Application Settings..' });
    const RTLConfFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    try {
        const config = addSecureData(req.body);
        common.appConfig = JSON.parse(JSON.stringify(config));
        delete config.selectedNodeIndex;
        delete config.enable2FA;
        delete config.allowPasswordUpdate;
        delete config.rtlConfFilePath;
        delete config.rtlPass;
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        const newConfig = JSON.parse(JSON.stringify(common.appConfig));
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Application Settings Updated', data: maskPasswords(newConfig) });
        res.status(201).json(removeSecureData(newConfig));
    }
    catch (errRes) {
        const errMsg = 'Update Default Node Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};

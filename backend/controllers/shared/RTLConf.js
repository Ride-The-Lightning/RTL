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
            const appConfData = common.removeSecureData(JSON.parse(data));
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
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Selected Node Updated To ' + req.session.selectedNode.lnNode || '' });
    res.status(200).json(common.removeAuthSecureData(JSON.parse(JSON.stringify(req.session.selectedNode))));
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
            jsonConfig = common.maskPasswords(jsonConfig);
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
        node.settings = req.body.settings;
        if (req.body.authentication.boltzMacaroonPath) {
            node.authentication.boltzMacaroonPath = req.body.authentication.boltzMacaroonPath;
        }
        else {
            delete node.authentication.boltzMacaroonPath;
        }
        if (req.body.authentication.swapMacaroonPath) {
            node.authentication.swapMacaroonPath = req.body.authentication.swapMacaroonPath;
        }
        else {
            delete node.authentication.swapMacaroonPath;
        }
    }
    try {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        const selectedNode = common.findNode(req.session.selectedNode.index);
        if (selectedNode && selectedNode.settings) {
            selectedNode.settings = req.body.settings;
            selectedNode.authentication.boltzMacaroonPath = req.body.authentication.boltzMacaroonPath;
            selectedNode.authentication.swapMacaroonPath = req.body.authentication.swapMacaroonPath;
            common.replaceNode(req, selectedNode);
        }
        let responseNode = JSON.parse(JSON.stringify(common.selectedNode));
        responseNode = common.removeAuthSecureData(responseNode);
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Node Settings Updated', data: responseNode });
        res.status(201).json(responseNode);
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
        const config = common.addSecureData(req.body);
        common.appConfig = JSON.parse(JSON.stringify(config));
        delete config.selectedNodeIndex;
        delete config.enable2FA;
        delete config.allowPasswordUpdate;
        delete config.rtlConfFilePath;
        delete config.rtlPass;
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        const newConfig = JSON.parse(JSON.stringify(common.appConfig));
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Application Settings Updated', data: common.maskPasswords(newConfig) });
        res.status(201).json(common.removeSecureData(newConfig));
    }
    catch (errRes) {
        const errMsg = 'Update Default Node Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};

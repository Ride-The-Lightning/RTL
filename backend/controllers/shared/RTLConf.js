import * as fs from 'fs';
import { sep } from 'path';
import ini from 'ini';
import parseHocon from 'hocon-parser';
import request from 'request-promise';
import { Database } from '../../utils/database.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
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
                (keys[i].toLowerCase().includes('password') || keys[i].toLowerCase().includes('multipass') ||
                    keys[i].toLowerCase().includes('rpcpass') || keys[i].toLowerCase().includes('rpcpassword') ||
                    keys[i].toLowerCase().includes('rpcuser'))) {
                obj[keys[i]] = '*'.repeat(20);
            }
        }
    }
    return obj;
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
export const getRTLConfig = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Getting RTL Configuration..' });
    const confFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    fs.readFile(confFile, 'utf8', (errRes, data) => {
        if (errRes) {
            const errMsg = 'Get Node Config Error';
            const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        }
        else {
            const nodeConfData = JSON.parse(data);
            const nodesArr = [];
            if (common.nodes && common.nodes.length > 0) {
                common.nodes.forEach((node, i) => {
                    nodesArr.push({
                        index: node.index,
                        lnNode: node.lnNode,
                        lnImplementation: node.lnImplementation,
                        settings: node.settings,
                        authentication: req.params.init ? {} : node.authentication
                    });
                });
            }
            const body = { defaultNodeIndex: nodeConfData.defaultNodeIndex, selectedNodeIndex: (req.session.selectedNode && req.session.selectedNode.index ? req.session.selectedNode.index : common.selectedNode.index),
                sso: common.appConfig.sso, enable2FA: !!common.appConfig.rtlSecret2fa, allowPasswordUpdate: common.appConfig.allowPasswordUpdate, nodes: nodesArr };
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'RTL Configuration Received', data: body });
            res.status(200).json(body);
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
    const { updatedSettings } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating UI Settings..' });
    const RTLConfFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    const node = config.nodes.find((node) => (node.index === req.session.selectedNode.index));
    if (node && node.Settings) {
        node.Settings.userPersona = updatedSettings.userPersona;
        node.Settings.themeMode = updatedSettings.themeMode;
        node.Settings.themeColor = updatedSettings.themeColor;
        node.Settings.unannouncedChannels = updatedSettings.unannouncedChannels;
        node.Settings.fiatConversion = updatedSettings.fiatConversion;
        if (updatedSettings.fiatConversion) {
            node.Settings.currencyUnit = updatedSettings.currencyUnit ? updatedSettings.currencyUnit : 'USD';
        }
        else {
            delete node.Settings.currencyUnit;
        }
        const selectedNode = common.findNode(req.session.selectedNode.index);
        selectedNode.settings.userPersona = updatedSettings.userPersona;
        selectedNode.settings.themeMode = updatedSettings.themeMode;
        selectedNode.settings.themeColor = updatedSettings.themeColor;
        selectedNode.settings.unannouncedChannels = updatedSettings.unannouncedChannels;
        selectedNode.settings.fiatConversion = updatedSettings.fiatConversion;
        if (updatedSettings.fiatConversion) {
            selectedNode.settings.currencyUnit = updatedSettings.currencyUnit ? updatedSettings.currencyUnit : 'USD';
        }
        else {
            delete selectedNode.settings.currencyUnit;
        }
        common.replaceNode(req, selectedNode);
    }
    try {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'UI Settings Updated', data: maskPasswords(config) });
        res.status(201).json({ message: 'Node Settings Updated Successfully' });
    }
    catch (errRes) {
        const errMsg = 'Update Node Settings Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};
export const updateApplicationSettings = (req, res, next) => {
    const { defaultNodeIndex } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating Default Node..' });
    const RTLConfFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    config.defaultNodeIndex = defaultNodeIndex;
    try {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Default Node Updated', data: maskPasswords(config) });
        res.status(201).json({ message: 'Default Node Updated Successfully' });
    }
    catch (errRes) {
        const errMsg = 'Update Default Node Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};
export const update2FASettings = (req, res, next) => {
    const { secret2fa } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating 2FA Settings..' });
    const RTLConfFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    if (secret2fa && secret2fa.trim() !== '') {
        config.secret2fa = secret2fa;
    }
    else {
        delete config.secret2fa;
    }
    const message = secret2fa.trim() === '' ? 'Two factor authentication disabled successfully.' : 'Two factor authentication enabled successfully.';
    try {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        common.appConfig.rtlSecret2fa = config.secret2fa;
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: message });
        res.status(201).json({ message: message });
    }
    catch (errRes) {
        const errMsg = 'Update 2FA Settings Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};
export const updateSSO = (req, res, next) => {
    const { SSO } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating SSO Settings..' });
    const RTLConfFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    delete config.SSO;
    config.SSO = SSO;
    try {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'SSO Setting Updated', data: maskPasswords(config) });
        res.status(201).json({ message: 'SSO Updated Successfully' });
    }
    catch (errRes) {
        const errMsg = 'Update SSO Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};
export const updateServiceSettings = (req, res, next) => {
    const { service, settings } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating Service Settings..' });
    const RTLConfFile = common.appConfig.rtlConfFilePath + sep + 'RTL-Config.json';
    const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
    const selectedNode = common.findNode(req.session.selectedNode.index);
    config.nodes.forEach((node) => {
        if (node.index === req.session.selectedNode.index) {
            switch (service) {
                case 'LOOP':
                    if (settings.enable) {
                        node.Settings.swapServerUrl = settings.serverUrl;
                        node.Authentication.swapMacaroonPath = settings.macaroonPath;
                        selectedNode.settings.swapServerUrl = settings.serverUrl;
                        selectedNode.authentication.swapMacaroonPath = settings.macaroonPath;
                    }
                    else {
                        delete node.Settings.swapServerUrl;
                        delete node.Authentication.swapMacaroonPath;
                        delete selectedNode.settings.swapServerUrl;
                        delete selectedNode.authentication.swapMacaroonPath;
                    }
                    break;
                case 'BOLTZ':
                    if (settings.enable) {
                        node.Settings.boltzServerUrl = settings.serverUrl;
                        node.Authentication.boltzMacaroonPath = settings.macaroonPath;
                        selectedNode.settings.boltzServerUrl = settings.serverUrl;
                        selectedNode.authentication.boltzMacaroonPath = settings.macaroonPath;
                    }
                    else {
                        delete node.Settings.boltzServerUrl;
                        delete node.Authentication.boltzMacaroonPath;
                        delete selectedNode.settings.boltzServerUrl;
                        delete selectedNode.authentication.boltzMacaroonPath;
                    }
                    break;
                case 'OFFERS':
                    node.Settings.enableOffers = settings.enableOffers;
                    selectedNode.settings.enableOffers = settings.enableOffers;
                    break;
                case 'PEERSWAP':
                    node.Settings.enablePeerswap = settings.enablePeerswap;
                    selectedNode.settings.enablePeerswap = settings.enablePeerswap;
                    break;
                default:
                    break;
            }
            common.replaceNode(req, selectedNode);
        }
        return node;
    });
    try {
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Service Settings Updated', data: maskPasswords(config) });
        res.status(201).json({ message: 'Service Settings Updated Successfully' });
    }
    catch (errRes) {
        const errMsg = 'Update Service Settings Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};

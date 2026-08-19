import jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { resolve, sep } from 'path';
import ini from 'ini';
import parseHocon from 'hocon-parser';
import request from '../../utils/request.js';
import { Database } from '../../utils/database.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
import { Authentication } from '../../models/config.model.js';
const options = { url: '' };
const logger = Logger;
const common = Common;
const wsServer = WSServer;
const databaseService = Database;
// The settings API echoes the whole config back, so these are the only per-node fields
// accepted from the request body. Credential paths and runtime-only fields are not here;
// addSecureData re-pins the credential paths for existing nodes and strips them for new
// ones. Anything else arriving under authentication/settings is discarded.
const NODE_SETTINGS_ALLOWLIST = [
    'blockExplorerUrl', 'logLevel', 'logFile', 'userPersona', 'themeMode', 'themeColor',
    'unannouncedChannels', 'fiatConversion', 'currencyUnit', 'enableOffers', 'enablePeerswap',
    'lnServerUrl', 'swapServerUrl', 'boltzServerUrl', 'bitcoindConfigPath', 'channelBackupPath'
];
const NODE_AUTH_ALLOWLIST = ['swapMacaroonPath', 'boltzMacaroonPath'];
const indexKey = (node) => +node.index;
const isValidServerUrl = (url) => {
    if (typeof url !== 'string' || url.trim() === '') {
        return false;
    }
    try {
        const parsed = new URL(url);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && !!parsed.hostname;
    }
    catch {
        return false;
    }
};
// Set local block explorer URL after first API call
// if the selected node block explorer has working REST API suite
// otherwise set it to mempool.space
let blockExplorerUrl = '';
export const getExplorerFeesRecommended = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Getting Recommended Fee Rates..' });
    options.url = (blockExplorerUrl === '') ?
        req.session.selectedNode.settings.blockExplorerUrl + '/api/v1/fees/recommended' :
        blockExplorerUrl + '/api/v1/fees/recommended';
    request(options).then((body) => {
        blockExplorerUrl = req.session.selectedNode.settings.blockExplorerUrl;
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Recommended Fee Rates Received', data: body });
        res.status(200).json(JSON.parse(body));
    }).catch((errRes) => {
        blockExplorerUrl = 'https://mempool.space';
        options.url = blockExplorerUrl + '/api/v1/fees/recommended';
        return request(options).then((body) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Recommended Fee Rates Received', data: body });
            res.status(200).json(JSON.parse(body));
        }).catch((errRes) => {
            const errMsg = 'Get Recommended Fee Rates Error';
            const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        });
    });
};
export const getExplorerTransaction = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Getting Transaction From Block Explorer..' });
    options.url = (blockExplorerUrl === '') ?
        req.session.selectedNode.settings.blockExplorerUrl + '/api/tx/' + req.params.txid :
        blockExplorerUrl + '/api/tx/' + req.params.txid;
    request(options).then((body) => {
        blockExplorerUrl = req.session.selectedNode.settings.blockExplorerUrl;
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Transaction From Block Explorer Received', data: body });
        res.status(200).json(JSON.parse(body));
    }).catch((errRes) => {
        blockExplorerUrl = 'https://mempool.space';
        options.url = blockExplorerUrl + '/api/tx/' + req.params.txid;
        return request(options).then((body) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Transaction From Block Explorer Received', data: body });
            res.status(200).json(JSON.parse(body));
        }).catch((errRes) => {
            const errMsg = 'Get Transaction From Block Explorer Error';
            const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.error, error: err.error });
        });
    });
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
    const channelBackupPath = req.session.selectedNode.settings.channelBackupPath;
    let file = '';
    if (req.query.path) {
        // The UI only ever requests channel backup files; contain caller paths to the node's
        // backup directory so this endpoint cannot read the config, macaroons or the SSO
        // cookie (getConfig serves the config file masked; this must not bypass that).
        const resolved = resolve(req.query.path);
        if (resolved !== resolve(channelBackupPath) && !resolved.startsWith(resolve(channelBackupPath) + sep)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'RTLConf', msg: 'Blocked file read outside the channel backup directory', data: req.query.path });
            const err = common.handleError({ statusCode: 403, message: 'Reading File Error', error: 'File path is outside the channel backup directory' }, 'RTLConf', 'Reading File Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        }
        file = resolved;
    }
    else {
        file = channelBackupPath + sep + 'channel-' + req.query.channel?.replace(':', '-') + '.bak';
    }
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
            // File contents can carry node credentials; never write them to the log.
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'File Data Received' });
            res.status(200).json(data);
        }
    });
};
export const getApplicationSettings = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Getting RTL Configuration..' });
    const appConfData = common.removeSecureData(JSON.parse(JSON.stringify(common.appConfig)));
    appConfData.allowPasswordUpdate = common.appConfig.allowPasswordUpdate;
    appConfData.enable2FA = common.appConfig.enable2FA;
    appConfData.selectedNodeIndex = (req.session.selectedNode && req.session.selectedNode.index ? req.session.selectedNode.index : common.selectedNode.index);
    common.appConfig.selectedNodeIndex = appConfData.selectedNodeIndex;
    const token = req.headers.authorization ? req.headers.authorization.split(' ')[1] : '';
    jwt.verify(token, common.secret_key, (err, user) => {
        if (err) {
            // Delete unnecessary data for initial response (without security token)
            const selNodeIdx = appConfData.nodes.findIndex((node) => node.index === appConfData.selectedNodeIndex) || 0;
            delete appConfData.SSO.rtlCookiePath;
            delete appConfData.SSO.cookieValue;
            delete appConfData.SSO.logoutRedirectLink;
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
};
export const updateSelectedNode = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Updating Selected Node..' });
    const selNodeIndex = req.params.currNodeIndex ? +req.params.currNodeIndex : common.selectedNode ? +common.selectedNode.index : 1;
    req.session.selectedNode = common.findNode(selNodeIndex);
    common.selectedNode = req.session.selectedNode;
    if (req.headers && req.headers.authorization && req.headers.authorization !== '') {
        wsServer.updateLNWSClientDetails(req.session.id, +req.session.selectedNode.index, +req.params.prevNodeIndex);
        if (req.params.prevNodeIndex !== '-1') {
            databaseService.unloadDatabase(req.params.prevNodeIndex, req.session.id);
        }
        if (req.params.currNodeIndex !== '-1') {
            databaseService.loadDatabase(req.session);
        }
    }
    blockExplorerUrl = '';
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
    try {
        const config = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
        const node = config.nodes.find((node) => (node.index === req.session.selectedNode.index));
        if (node && node.settings) {
            // channelBackupPath anchors getFile's containment root and is documented as a
            // config-file-only setting; accepting it from the API would let the caller being
            // contained choose the containment base. Pin it to the server-held value.
            const serverChannelBackupPath = node.settings.channelBackupPath;
            node.settings = { ...node.settings, ...req.body.settings };
            node.settings.channelBackupPath = serverChannelBackupPath;
            if (node.authentication && req.body.authentication) {
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
        }
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        const selectedNode = common.findNode(req.session.selectedNode.index);
        if (selectedNode && selectedNode.settings) {
            const serverChannelBackupPath = selectedNode.settings.channelBackupPath;
            selectedNode.settings = { ...selectedNode.settings, ...req.body.settings };
            selectedNode.settings.channelBackupPath = serverChannelBackupPath;
            if (selectedNode.authentication && req.body.authentication) {
                if (req.body.authentication.boltzMacaroonPath) {
                    selectedNode.authentication.boltzMacaroonPath = req.body.authentication.boltzMacaroonPath;
                }
                else {
                    delete selectedNode.authentication.boltzMacaroonPath;
                }
                if (req.body.authentication.swapMacaroonPath) {
                    selectedNode.authentication.swapMacaroonPath = req.body.authentication.swapMacaroonPath;
                }
                else {
                    delete selectedNode.authentication.swapMacaroonPath;
                }
            }
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
        const oldConfig = JSON.parse(fs.readFileSync(RTLConfFile, 'utf-8'));
        // Allowlist the per-node payload before addSecureData runs, so an injected credential
        // path, runeValue/options or unknown setting can never reach the runtime config or
        // the file — the same strategy updateNodeSettings applies to its settings merge.
        const requestBody = JSON.parse(JSON.stringify(req.body));
        requestBody.nodes?.forEach((node) => {
            if (node.authentication && typeof node.authentication === 'object') {
                node.authentication = Object.fromEntries(Object.entries(node.authentication).filter(([key]) => NODE_AUTH_ALLOWLIST.includes(key)));
            }
            if (node.settings && typeof node.settings === 'object') {
                node.settings = Object.fromEntries(Object.entries(node.settings).filter(([key]) => NODE_SETTINGS_ALLOWLIST.includes(key)));
            }
        });
        const config = common.addSecureData(requestBody);
        const runtimeConfig = oldConfig;
        Object.keys(config).forEach((key) => {
            if (key !== 'nodes') {
                runtimeConfig[key] = config[key];
            }
        });
        if (config.nodes && config.nodes.length > 0) {
            const oldNodes = (common.appConfig.nodes && common.appConfig.nodes.length > 0) ? common.appConfig.nodes : (oldConfig.nodes || []);
            const newNodesMap = new Map(config.nodes.map((node) => [indexKey(node), node]));
            const updatedAndExistingNodes = oldNodes.map((oldNode) => {
                const newNode = newNodesMap.get(indexKey(oldNode));
                newNodesMap.delete(indexKey(oldNode));
                const node = newNode ? {
                    ...oldNode,
                    ...newNode,
                    authentication: { ...(oldNode.authentication || {}), ...(newNode.authentication || {}) },
                    settings: { ...(oldNode.settings || {}), ...(newNode.settings || {}) }
                } : {
                    ...oldNode,
                    authentication: { ...(oldNode.authentication || {}) },
                    settings: { ...(oldNode.settings || {}) }
                };
                node.index = Number.isFinite(indexKey(node)) ? indexKey(node) : node.index;
                return node;
            });
            const newOnlyNodes = [...newNodesMap.values()].map((newNode) => {
                const node = JSON.parse(JSON.stringify(newNode));
                node.index = Number.isFinite(indexKey(node)) ? indexKey(node) : node.index;
                return node;
            });
            // A node unknown to the server cannot be provisioned with credentials through this
            // endpoint; validate the only server anchor it may carry before persisting.
            const invalidNewNode = newOnlyNodes.find((node) => node.settings?.lnServerUrl && !isValidServerUrl(node.settings.lnServerUrl));
            if (invalidNewNode) {
                const errMsg = 'Invalid lnServerUrl format for node index ' + invalidNewNode.index;
                const err = common.handleError({ statusCode: 400, message: errMsg, error: errMsg }, 'RTLConf', 'Update Default Node Error', req.session.selectedNode);
                return res.status(err.statusCode).json({ message: err.error, error: err.error });
            }
            runtimeConfig.nodes = [...updatedAndExistingNodes, ...newOnlyNodes];
        }
        const newAppConfig = JSON.parse(JSON.stringify({
            ...runtimeConfig,
            selectedNodeIndex: config.selectedNodeIndex !== undefined ?
                config.selectedNodeIndex : common.appConfig.selectedNodeIndex,
            enable2FA: config.enable2FA !== undefined ?
                config.enable2FA : common.appConfig.enable2FA,
            allowPasswordUpdate: config.allowPasswordUpdate !== undefined ?
                config.allowPasswordUpdate : common.appConfig.allowPasswordUpdate,
            rtlConfFilePath: common.appConfig.rtlConfFilePath,
            rtlPass: common.appConfig.rtlPass
        }));
        const fileConfig = JSON.parse(JSON.stringify(newAppConfig));
        delete fileConfig.selectedNodeIndex;
        delete fileConfig.enable2FA;
        delete fileConfig.allowPasswordUpdate;
        delete fileConfig.rtlConfFilePath;
        delete fileConfig.rtlPass;
        delete fileConfig.multiPass;
        // Runtime-only SSO bearer; must not be persisted with the config.
        if (fileConfig.SSO) {
            delete fileConfig.SSO.cookieValue;
        }
        fileConfig.nodes?.forEach((node) => {
            delete node.authentication?.options;
            delete node.authentication?.runeValue;
        });
        // Persist atomically (temp file + rename, so a mid-write failure cannot truncate the
        // config) and only then adopt the new runtime config, so a failed write leaves the
        // process on the old one. The temp file inherits the existing file's mode so a
        // hardened 0600 is not silently downgraded; a fresh file gets 0600. Symlinks and
        // single-file bind mounts cannot be renamed over — fall back to an in-place write,
        // which preserves inode and mode.
        const tempConfigFile = RTLConfFile + '.tmp';
        try {
            fs.writeFileSync(tempConfigFile, JSON.stringify(fileConfig, null, 2), 'utf-8');
            fs.chmodSync(tempConfigFile, fs.existsSync(RTLConfFile) ? (fs.statSync(RTLConfFile).mode & 0o777) : 0o600);
            fs.renameSync(tempConfigFile, RTLConfFile);
        }
        catch {
            fs.rmSync(tempConfigFile, { force: true, recursive: true });
            fs.writeFileSync(RTLConfFile, JSON.stringify(fileConfig, null, 2), 'utf-8');
        }
        common.appConfig = newAppConfig;
        // removeSecureData clones, so the runtime config is untouched; it strips rtlPass,
        // the TOTP seed, the SSO cookie and all per-node credentials symmetrically.
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'RTLConf', msg: 'Application Settings Updated', data: common.removeSecureData(newAppConfig) });
        res.status(201).json(common.removeSecureData(newAppConfig));
    }
    catch (errRes) {
        const errMsg = 'Update Default Node Error';
        const err = common.handleError({ statusCode: 500, message: errMsg, error: errRes }, 'RTLConf', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.error, error: err.error });
    }
};

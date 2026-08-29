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
// The settings API echoes the whole config back, so these are the only per-node settings
// fields accepted from the application-settings request body. Credential paths, LN server
// URLs, runtime-only fields (options, runeValue) and logFile (config.ts overwrites it at
// boot) are not here; addSecureData re-pins credential paths and LN server URLs to the
// server-held values for existing nodes, and strips them from unknown nodes entirely.
// Anything else arriving under settings is discarded.
const NODE_SETTINGS_ALLOWLIST = [
    'blockExplorerUrl', 'logLevel', 'userPersona', 'themeMode', 'themeColor',
    'unannouncedChannels', 'fiatConversion', 'currencyUnit', 'enableOffers', 'enablePeerswap'
];
// Loop and Boltz server URLs are service settings, edited from the node-config Services
// page through the node-settings endpoint only (their macaroon paths are edited the same
// way). They are deliberately not in NODE_SETTINGS_ALLOWLIST: the application-settings
// endpoint re-pins them, so accepting them there would be dead weight.
const NODE_SERVICE_SETTINGS_ALLOWLIST = ['swapServerUrl', 'boltzServerUrl'];
// Top-level keys accepted on a node object. authentication and settings are themselves
// filtered by the allowlists above; lnImplementation is deliberately absent — it selects
// which credential the server attaches to the (pinned) LN server URL, so letting the
// caller rewrite it would silently break the node connection after the next boot. Any
// other key (e.g. a root-level macaroonPath) is discarded so it can never be persisted
// alongside a node in RTL-Config.json.
const NODE_ALLOWLIST = ['index', 'lnNode', 'authentication', 'settings'];
// Top-level keys accepted from the request body on the application-settings endpoint.
// Anything not here is discarded; this prevents caller-invented keys from being persisted
// into RTL-Config.json and re-parsed at every save and boot. multiPass is not accepted:
// the plaintext password is hashed into multiPassHashed at boot and never sent back to
// the client, so no honest flow supplies it (addSecureData also pins it defensively).
const TOP_LEVEL_ALLOWLIST = [
    'defaultNodeIndex', 'selectedNodeIndex', 'enable2FA', 'allowPasswordUpdate',
    'dbDirectoryPath', 'disableAuth', 'multiPassHashed', 'secret2FA',
    'SSO', 'nodes'
];
const indexKey = (node) => {
    const val = node?.index;
    if (typeof val === 'number') {
        return val;
    }
    // Empty or whitespace-only strings must not coerce to 0 (node 0 is a real node).
    if (typeof val === 'string' && val.trim() !== '') {
        return +val;
    }
    return undefined;
};
// Reject malformed URLs and non-HTTP schemes. User-chosen block explorers and Loop/Boltz
// servers are intended RTL features (self-hosted instances), so this is format validation
// only — it does not prevent a caller from pointing at an internal host.
const isValidHttpUrl = (value) => {
    if (typeof value !== 'string') {
        return false;
    }
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
};
// Allowlist a settings payload and drop URL-valued fields that fail isValidHttpUrl.
// The node-settings endpoint additionally accepts the Loop/Boltz service URLs
// (allowServiceUrls); the application-settings endpoint does not. Both handlers share this
// so a malformed blockExplorerUrl/swapServerUrl/boltzServerUrl can never reach the
// outbound request built from the live node's settings.
const filterNodeSettings = (settings, allowServiceUrls = false) => {
    const allowed = Object.fromEntries(Object.entries(settings || {}).filter(([key]) => NODE_SETTINGS_ALLOWLIST.includes(key) ||
        (allowServiceUrls && NODE_SERVICE_SETTINGS_ALLOWLIST.includes(key))));
    for (const urlKey of ['blockExplorerUrl', 'swapServerUrl', 'boltzServerUrl']) {
        if (allowed[urlKey] !== undefined && !isValidHttpUrl(allowed[urlKey])) {
            delete allowed[urlKey];
        }
    }
    return allowed;
};
// The Loop/Boltz service macaroon paths are edited from the Services page and remain
// writable through the node-settings endpoint; an absent or empty value clears the field.
// The LN credential paths (macaroonPath, runePath, lnApiPassword, configPath) are not
// handled here and can never be set through this endpoint.
const applyWritableServiceMacaroonPaths = (target, source) => {
    if (!target || !source) {
        return;
    }
    if (source.boltzMacaroonPath) {
        target.boltzMacaroonPath = source.boltzMacaroonPath;
    }
    else {
        delete target.boltzMacaroonPath;
    }
    if (source.swapMacaroonPath) {
        target.swapMacaroonPath = source.swapMacaroonPath;
    }
    else {
        delete target.swapMacaroonPath;
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
        // The channel value is concatenated into the backup file name; neutralize path
        // separators and '..' so a crafted channel cannot walk out of the backup directory
        // (the UI only ever sends a channel point, "funding_txid:output").
        const channel = req.query.channel?.replace(/[:/\\]/g, '-').replace(/\.\./g, '-');
        file = channelBackupPath + sep + 'channel-' + channel + '.bak';
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
            // Allowlist incoming settings to the same set updateApplicationSettings uses, plus
            // the Loop/Boltz service URLs (swapServerUrl, boltzServerUrl), which the Services
            // page edits; URL fields get the same http/https format validation. Credential and
            // LN server anchors — bitcoindConfigPath, channelBackupPath, lnServerUrl, logFile —
            // stay out of the allowlist, so they are neither edited here nor persisted.
            node.settings = { ...node.settings, ...filterNodeSettings(req.body.settings, true) };
            // Loop/Boltz macaroon paths are a Services-page feature and stay editable here.
            applyWritableServiceMacaroonPaths(node.authentication, req.body.authentication);
        }
        fs.writeFileSync(RTLConfFile, JSON.stringify(config, null, 2), 'utf-8');
        const selectedNode = common.findNode(req.session.selectedNode.index);
        if (selectedNode && selectedNode.settings) {
            selectedNode.settings = { ...selectedNode.settings, ...filterNodeSettings(req.body.settings, true) };
            applyWritableServiceMacaroonPaths(selectedNode.authentication, req.body.authentication);
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
        // path, runeValue/options, unknown setting or unknown top-level node key (such as a
        // root-level macaroonPath) can never reach the runtime config or the file.
        const requestBody = JSON.parse(JSON.stringify(req.body));
        // Filter top-level keys to prevent caller-invented fields from being persisted into
        // RTL-Config.json and re-parsed at every save and boot.
        for (const key of Object.keys(requestBody)) {
            if (!TOP_LEVEL_ALLOWLIST.includes(key)) {
                delete requestBody[key];
            }
        }
        requestBody.nodes = requestBody.nodes?.map((node) => {
            const filteredNode = (node && typeof node === 'object') ?
                Object.fromEntries(Object.entries(node).filter(([key]) => NODE_ALLOWLIST.includes(key))) :
                node;
            // Strip authentication entirely: addSecureData re-pins all credential paths from
            // the server-held node, so any caller-supplied authentication value (runeValue,
            // options, macaroonPath, etc.) is dead weight that must not reach the runtime config
            // or the file.
            if (filteredNode && typeof filteredNode === 'object') {
                delete filteredNode.authentication;
            }
            if (filteredNode && filteredNode.settings && typeof filteredNode.settings === 'object') {
                filteredNode.settings = filterNodeSettings(filteredNode.settings);
            }
            return filteredNode;
        });
        // Nodes are never provisioned through this endpoint: there is no add-node UI for it,
        // and a caller-supplied credential path or server URL would be persisted to the config
        // file and loaded back into the runtime nodes at the next restart. Drop any node whose
        // index the server does not already know. Known-vs-unknown resolves against the single
        // authoritative runtime list (common.nodes) — the same list addSecureData pins from and
        // updateNodeSettings mutates in place. common.appConfig.nodes is a fresh clone after
        // every save and goes stale, so resolving against it would misclassify nodes.
        const knownIndexes = new Set(common.nodes?.map((node) => indexKey(node)).filter((idx) => Number.isFinite(idx)) || []);
        requestBody.nodes = requestBody.nodes?.filter((node) => {
            const idx = indexKey(node);
            if (Number.isFinite(idx) && knownIndexes.has(idx)) {
                return true;
            }
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'RTLConf', msg: 'Ignoring unknown node index in application settings; nodes cannot be added through this endpoint', data: { index: node?.index } });
            return false;
        });
        // defaultNodeIndex and selectedNodeIndex pass TOP_LEVEL_ALLOWLIST but must carry the
        // same known-index discipline as nodes[]: defaultNodeIndex is persisted (unlike
        // selectedNodeIndex it is not stripped from the file config), so an unparseable value
        // or one naming a dropped node would survive a restart. Drop any such value; the
        // server-held current index wins (selectedNodeIndex falls back in newAppConfig).
        for (const scalarKey of ['defaultNodeIndex', 'selectedNodeIndex']) {
            if (requestBody[scalarKey] !== undefined) {
                const idx = indexKey({ index: requestBody[scalarKey] });
                if (!Number.isFinite(idx) || !knownIndexes.has(idx)) {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'RTLConf', msg: `Ignoring invalid ${scalarKey} in application settings; it must be the index of a known node`, data: { value: requestBody[scalarKey] } });
                    delete requestBody[scalarKey];
                }
            }
        }
        const config = common.addSecureData(requestBody);
        const runtimeConfig = oldConfig;
        Object.keys(config).forEach((key) => {
            if (key !== 'nodes') {
                runtimeConfig[key] = config[key];
            }
        });
        if (common.nodes && common.nodes.length > 0) {
            const newNodesMap = new Map(config.nodes?.map((node) => [indexKey(node), node]) || []);
            const updatedAndExistingNodes = common.nodes.map((oldNode) => {
                const newNode = newNodesMap.get(indexKey(oldNode));
                // Unknown-index nodes were dropped above, so every config node has a matching
                // runtime node; a plain lookup (not a consuming delete) means a duplicate index
                // in the runtime list cannot leave the payload hanging unmerged.
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
            runtimeConfig.nodes = updatedAndExistingNodes;
        }
        else {
            // No live runtime nodes to merge with (cannot happen after a normal boot:
            // common.nodes is built from the file at boot and only mutated in place afterwards).
            // Record the allowlisted-and-pinned payload rather than silently reverting to the
            // on-disk copy — the save the caller is told about must be what the file records.
            runtimeConfig.nodes = config.nodes || [];
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

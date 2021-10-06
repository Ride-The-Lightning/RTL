"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAliasesForPubkeys = exports.getRemoteFeePolicy = exports.getQueryRoutes = exports.getGraphEdge = exports.getGraphNode = exports.getGraphInfo = exports.getDescribeGraph = exports.getAliasFromPubkey = void 0;
const request = require("request-promise");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
let options = null;
const logger = logger_1.Logger;
const common = common_1.Common;
const getAliasFromPubkey = (pubkey) => {
    options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + pubkey;
    return request(options).then((res) => {
        logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Alias', data: res.node.alias });
        return res.node.alias;
    }).
        catch((err) => pubkey.substring(0, 17) + '...');
};
exports.getAliasFromPubkey = getAliasFromPubkey;
const getDescribeGraph = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Getting Network Graph..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/graph';
    request.get(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Describe Graph Received', data: body });
        logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Network Graph Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Graph', 'Describe Graph Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getDescribeGraph = getDescribeGraph;
const getGraphInfo = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Information..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/graph/info';
    request.get(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Network Information After Rounding and Conversion', data: body });
        logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Graph Information Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Graph', 'Graph Information Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getGraphInfo = getGraphInfo;
const getGraphNode = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Node Information..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/graph/node/' + req.params.pubKey;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Node Info Received', data: body });
        logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Graph Node Information Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Graph', 'Get Node Info Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getGraphNode = getGraphNode;
const getGraphEdge = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Edge Information..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/graph/edge/' + req.params.chanid;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Edge Info Received', data: body });
        logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Graph Edge Information Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Graph', 'Get Edge Info Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getGraphEdge = getGraphEdge;
const getQueryRoutes = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Getting Graph Routes..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/graph/routes/' + req.params.destPubkey + '/' + req.params.amount;
    if (req.query.outgoing_chan_id) {
        options.url = options.url + '?outgoing_chan_id=' + req.query.outgoing_chan_id;
    }
    logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Query Routes URL', data: options.url });
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Query Routes Received', data: body });
        if (body.routes && body.routes.length && body.routes.length > 0 && body.routes[0].hops && body.routes[0].hops.length && body.routes[0].hops.length > 0) {
            return Promise.all(body.routes[0].hops.map((hop) => exports.getAliasFromPubkey(hop.pub_key))).
                then((values) => {
                body.routes[0].hops.map((hop, i) => {
                    hop.hop_sequence = i + 1;
                    hop.pubkey_alias = values[i];
                    return hop;
                });
                logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Hops with Alias', data: body });
                logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Graph Routes Received' });
                res.status(200).json(body);
            }).
                catch((errRes) => {
                const err = common.handleError(errRes, 'Graph', 'Get Query Routes Error');
                return res.status(err.statusCode).json({ message: err.message, error: err.error });
            });
        }
        else {
            logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Graph Routes Received' });
            return res.status(200).json(body);
        }
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Graph', 'Get Query Routes Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getQueryRoutes = getQueryRoutes;
const getRemoteFeePolicy = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Getting Remote Fee Policy..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/graph/edge/' + req.params.chanid;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Edge Info Received', data: body });
        let remoteNodeFee = {};
        if (body.node1_pub === req.params.localPubkey) {
            remoteNodeFee = {
                time_lock_delta: body.node2_policy.time_lock_delta,
                fee_base_msat: body.node2_policy.fee_base_msat,
                fee_rate_milli_msat: body.node2_policy.fee_rate_milli_msat
            };
        }
        else if (body.node2_pub === req.params.localPubkey) {
            remoteNodeFee = {
                time_lock_delta: body.node1_policy.time_lock_delta,
                fee_base_msat: body.node1_policy.fee_base_msat,
                fee_rate_milli_msat: body.node1_policy.fee_rate_milli_msat
            };
        }
        logger.log({ level: 'INFO', fileName: 'Graph', msg: 'Remote Fee Policy Received' });
        res.status(200).json(remoteNodeFee);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Graph', 'Remote Fee Policy Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getRemoteFeePolicy = getRemoteFeePolicy;
const getAliasesForPubkeys = (req, res, next) => {
    options = common.getOptions();
    if (req.query.pubkeys) {
        const pubkeyArr = req.query.pubkeys.split(',');
        return Promise.all(pubkeyArr.map((pubkey) => exports.getAliasFromPubkey(pubkey))).
            then((values) => {
            logger.log({ level: 'DEBUG', fileName: 'Graph', msg: 'Node Alias', data: values });
            res.status(200).json(values);
        }).
            catch((errRes) => {
            const err = common.handleError(errRes, 'Graph', 'Get Aliases for Pubkeys Error');
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
    else {
        return res.status(200).json([]);
    }
};
exports.getAliasesForPubkeys = getAliasesForPubkeys;

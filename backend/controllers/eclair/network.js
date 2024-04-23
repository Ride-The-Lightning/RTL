import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getNodes = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Node Lookup..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/nodes';
    options.form = { nodeIds: req.params.id };
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Node Lookup Finished', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Node Lookup Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const findRouteBetweenNodesRequestCall = (selectedNode, amountMsat, sourceNodeId, targetNodeId, ignoreNodeIds = [], format = 'shortChannelId') => {
    logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Network', msg: 'Find Route Between Nodes..' });
    options = selectedNode.authentication.options;
    options.url = selectedNode.settings.lnServerUrl + '/findroutebetweennodes';
    options.form = { amountMsat: amountMsat, sourceNodeId: sourceNodeId, targetNodeId: targetNodeId, ignoreNodeIds: ignoreNodeIds, format: format };
    return new Promise((resolve, reject) => {
        request.post(options).then((body) => {
            logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Network', msg: 'Route Lookup Between Nodes Finished', data: body });
            resolve(body);
        }).catch((errRes) => {
            reject(common.handleError(errRes, 'Network', 'Route Lookup Between Nodes Error', selectedNode));
        });
    });
};
export const findRouteBetweenNodes = (req, res, next) => {
    const { amountMsat, sourceNodeId, targetNodeId, ignoreNodeIds, format } = req.body;
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    findRouteBetweenNodesRequestCall(req.session.selectedNode, amountMsat, sourceNodeId, targetNodeId, ignoreNodeIds, format).then((callRes) => {
        res.status(200).json(callRes);
    }).catch((err) => res.status(err.statusCode).json({ message: err.message, error: err.error }));
};

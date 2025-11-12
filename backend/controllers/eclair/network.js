import axios from 'axios';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getNodes = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Node Lookup..' });
    const axiosConfig = common.getAxiosConfig(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/nodes';
    options.form = { nodeIds: req.params.id };
    axios.post(options).then((body) => {
        body = body.data;
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Node Lookup Finished', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Network', 'Node Lookup Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const findRouteBetweenNodesRequestCall = (selectedNode, amountMsat, sourceNodeId, targetNodeId, ignoreNodeIds = [], format = 'shortChannelId') => {
    logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Network', msg: 'Find Route Between Nodes..' });
    const form = { amountMsat: amountMsat, sourceNodeId: sourceNodeId, targetNodeId: targetNodeId, ignoreNodeIds: ignoreNodeIds, format: format };
    return new Promise((resolve, reject) => {
        axios.post(selectedNode.settings.lnServerUrl + '/findroutebetweennodes', form, selectedNode.axiosConfig).then((body) => {
            body = body.data;
            logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Network', msg: 'Route Lookup Between Nodes Finished', data: body });
            resolve(body);
        }).catch((errRes) => {
            reject(common.handleError(errRes, 'Network', 'Route Lookup Between Nodes Error', selectedNode));
        });
    });
};
export const findRouteBetweenNodes = (req, res, next) => {
    const { amountMsat, sourceNodeId, targetNodeId, ignoreNodeIds, format } = req.body;
    const axiosConfig = common.getAxiosConfig(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    findRouteBetweenNodesRequestCall(req.session.selectedNode, amountMsat, sourceNodeId, targetNodeId, ignoreNodeIds, format).then((callRes) => {
        res.status(200).json(callRes);
    }).catch((err) => res.status(err.statusCode).json({ message: err.message, error: err.error }));
};

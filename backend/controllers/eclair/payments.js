import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getSentInfoFromPaymentRequest = (selNode, payment) => {
    options.url = selNode.ln_server_url + '/getsentinfo';
    options.form = { paymentHash: payment };
    return request
        .post(options)
        .then((body) => {
        logger.log({
            selectedNode: selNode,
            level: 'DEBUG',
            fileName: 'Payments',
            msg: 'Payment Sent Information Received',
            data: body
        });
        body.forEach((sentPayment) => {
            if (sentPayment.amount) {
                sentPayment.amount = Math.round(sentPayment.amount / 1000);
            }
            if (sentPayment.recipientAmount) {
                sentPayment.recipientAmount = Math.round(sentPayment.recipientAmount / 1000);
            }
        });
        return body;
    })
        .catch((err) => err);
};
export const getQueryNodes = (selNode, nodeIds) => {
    options.url = selNode.ln_server_url + '/nodes';
    options.form = { nodeIds: nodeIds.reduce((acc, curr) => acc + ',' + curr) };
    return request
        .post(options)
        .then((nodes) => {
        logger.log({
            selectedNode: selNode,
            level: 'DEBUG',
            fileName: 'Payments',
            msg: 'Query Nodes Received',
            data: nodes
        });
        return nodes;
    })
        .catch((err) => []);
};
export const decodePayment = (req, res, next) => {
    logger.log({
        selectedNode: req.session.selectedNode,
        level: 'INFO',
        fileName: 'Payments',
        msg: 'Decoding Payment..'
    });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/parseinvoice';
    options.form = { invoice: req.params.invoice };
    request
        .post(options)
        .then((body) => {
        logger.log({
            selectedNode: req.session.selectedNode,
            level: 'INFO',
            fileName: 'Payments',
            msg: 'Payment Decoded',
            data: body
        });
        if (body.amount) {
            body.amount = Math.round(body.amount / 1000);
        }
        res.status(200).json(body);
    })
        .catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Decode Payment Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postPayment = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Paying Invoice..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/payinvoice';
    options.form = req.body;
    logger.log({
        selectedNode: req.session.selectedNode,
        level: 'DEBUG',
        fileName: 'Payments',
        msg: 'Send Payment Options',
        data: options.form
    });
    request
        .post(options)
        .then((body) => {
        logger.log({
            selectedNode: req.session.selectedNode,
            level: 'INFO',
            fileName: 'Payments',
            msg: 'Invoice Paid',
            data: body
        });
        res.status(201).json(body);
    })
        .catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Send Payment Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const queryPaymentRoute = (req, res, next) => {
    logger.log({
        selectedNode: req.session.selectedNode,
        level: 'INFO',
        fileName: 'Payments',
        msg: 'Querying Payment Route..'
    });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/findroutetonode';
    options.form = {
        nodeId: req.query.nodeId,
        amountMsat: req.query.amountMsat
    };
    logger.log({
        selectedNode: req.session.selectedNode,
        level: 'DEBUG',
        fileName: 'Payments',
        msg: 'Query Payment Route Options',
        data: options.form
    });
    request
        .post(options)
        .then((body) => {
        logger.log({
            selectedNode: req.session.selectedNode,
            level: 'DEBUG',
            fileName: 'Payments',
            msg: 'Query Payment Route Received',
            data: body
        });
        if (body && body.routes && body.routes.length) {
            let allRoutesNodeIds = [];
            allRoutesNodeIds = body.routes.reduce((accRoutes, currRoute) => [...new Set([...accRoutes, ...currRoute.nodeIds])], []);
            return getQueryNodes(req.session.selectedNode, allRoutesNodeIds).then((nodesWithAlias) => {
                let foundPeer = null;
                body.routes.forEach((route, i) => {
                    route.nodeIds.map((node, j) => {
                        foundPeer = nodesWithAlias.find((nodeWithAlias) => node === nodeWithAlias.nodeId);
                        body.routes[i].nodeIds[j] = { nodeId: node, alias: foundPeer ? foundPeer.alias : '' };
                        return node;
                    });
                });
                logger.log({
                    selectedNode: req.session.selectedNode,
                    level: 'INFO',
                    fileName: 'Payments',
                    msg: 'Query Routes with Alias Received',
                    data: body
                });
                res.status(200).json(body);
            });
        }
        else {
            logger.log({
                selectedNode: req.session.selectedNode,
                level: 'INFO',
                fileName: 'Payments',
                msg: 'Empty Payment Route Information Received'
            });
            res.status(200).json({ routes: [] });
        }
    })
        .catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Query Route Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getSentPaymentsInformation = (req, res, next) => {
    logger.log({
        selectedNode: req.session.selectedNode,
        level: 'INFO',
        fileName: 'Payments',
        msg: 'Getting Sent Payment Information..'
    });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    if (req.body.payments) {
        const paymentsArr = req.body.payments.split(',');
        return Promise.all(paymentsArr.map((payment) => getSentInfoFromPaymentRequest(req.session.selectedNode, payment)))
            .then((values) => {
            logger.log({
                selectedNode: req.session.selectedNode,
                level: 'INFO',
                fileName: 'Payments',
                msg: 'Payment Sent Information Received',
                data: values
            });
            return res.status(200).json(values);
        })
            .catch((errRes) => {
            const err = common.handleError(errRes, 'Payments', 'Sent Payment Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
    else {
        logger.log({
            selectedNode: req.session.selectedNode,
            level: 'INFO',
            fileName: 'Payments',
            msg: 'Empty Sent Payment Information Received'
        });
        return res.status(200).json([]);
    }
};

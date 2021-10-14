import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getQueryNodes = (nodeIds) => {
    options.url = common.getSelLNServerUrl() + '/nodes';
    options.form = { nodeIds: nodeIds };
    return request.post(options).then((nodes) => {
        logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Query Nodes', data: nodes });
        return nodes;
    }).catch((err) => []);
};
export const decodePayment = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Decoding Payment..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/parseinvoice';
    options.form = { invoice: req.params.invoice };
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Payment Decode Received', data: body });
        if (body.amount) {
            body.amount = Math.round(body.amount / 1000);
        }
        logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Payment Decoded' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Decode Payment Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postPayment = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Paying Invoice..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/payinvoice';
    options.form = req.body;
    logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Send Payment Options', data: options.form });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Send Payment Response', data: body });
        logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Invoice Paid' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Send Payment Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const queryPaymentRoute = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Querying Payment Route..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/findroutetonode';
    options.form = {
        nodeId: req.query.nodeId,
        amountMsat: req.query.amountMsat
    };
    logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Query Payment Route Options', data: options.form });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Query Payment Route Received', data: body });
        if (body && body.length) {
            const queryRoutes = [];
            return getQueryNodes(body).then((hopsWithAlias) => {
                let foundPeer = null;
                body.map((hop) => {
                    foundPeer = hopsWithAlias.find((hopWithAlias) => hop === hopWithAlias.nodeId);
                    queryRoutes.push({ nodeId: hop, alias: foundPeer ? foundPeer.alias : '' });
                    return hop;
                });
                logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Query Routes with Alias', data: queryRoutes });
                logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Payment Route Information Received' });
                res.status(200).json(queryRoutes);
            });
        }
        else {
            logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Empty Payment Route Information Received' });
            res.status(200).json([]);
        }
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Query Route Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getSentPaymentsInformation = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Getting Sent Payment Information..' });
    options = common.getOptions();
    if (req.body.payments) {
        const paymentsArr = req.body.payments.split(',');
        return Promise.all(paymentsArr.map((payment) => getSentInfoFromPaymentRequest(payment))).
            then((values) => {
            logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Payment Sent Informations', data: values });
            logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Sent Payment Information Received' });
            return res.status(200).json(values);
        }).
            catch((errRes) => {
            const err = common.handleError(errRes, 'Payments', 'Sent Payment Error');
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
    else {
        logger.log({ level: 'INFO', fileName: 'Payments', msg: 'Empty Sent Payment Information Received' });
        return res.status(200).json([]);
    }
};
export const getSentInfoFromPaymentRequest = (payment) => {
    options.url = common.getSelLNServerUrl() + '/getsentinfo';
    options.form = { paymentHash: payment };
    return request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Payment Sent Information Received', data: body });
        body.forEach((sentPayment) => {
            if (sentPayment.amount) {
                sentPayment.amount = Math.round(sentPayment.amount / 1000);
            }
            if (sentPayment.recipientAmount) {
                sentPayment.recipientAmount = Math.round(sentPayment.recipientAmount / 1000);
            }
        });
        return body;
    }).catch((err) => err);
};

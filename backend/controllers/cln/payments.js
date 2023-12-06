import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { Database } from '../../utils/database.js';
import { CollectionFieldsEnum, CollectionsEnum } from '../../models/database.model.js';
let options = null;
const logger = Logger;
const common = Common;
const databaseService = Database;
export const getMemo = (selNode, payment) => {
    options.url = selNode.ln_server_url + '/v1/decode';
    options.body = { string: payment.bolt11 };
    return request.post(options).then((res) => {
        logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Payments', msg: 'Payment Decode Received', data: res });
        payment.memo = res.description || '';
        return payment;
    }).catch((err) => {
        payment.memo = '';
        return payment;
    });
};
function paymentReducer(accumulator, currentPayment) {
    const currPayHash = currentPayment.payment_hash;
    if (!currentPayment.partid) {
        currentPayment.partid = 0;
    }
    if (!accumulator[currPayHash]) {
        accumulator[currPayHash] = [currentPayment];
    }
    else {
        accumulator[currPayHash].push(currentPayment);
    }
    return accumulator;
}
function summaryReducer(accumulator, mpp) {
    if (mpp.status === 'complete') {
        accumulator.amount_msat = accumulator.amount_msat + mpp.amount_msat;
        accumulator.amount_sent_msat = accumulator.amount_sent_msat + mpp.amount_sent_msat;
        accumulator.status = mpp.status;
    }
    if (mpp.bolt11) {
        accumulator.bolt11 = mpp.bolt11;
    }
    if (mpp.bolt12) {
        accumulator.bolt12 = mpp.bolt12;
    }
    return accumulator;
}
function groupBy(payments) {
    const paymentsInGroups = payments?.reduce(paymentReducer, {});
    const paymentsGrpArray = Object.keys(paymentsInGroups)?.map((key) => ((paymentsInGroups[key].length && paymentsInGroups[key].length > 1) ? common.sortDescByKey(paymentsInGroups[key], 'partid') : paymentsInGroups[key]));
    return paymentsGrpArray?.reduce((acc, curr) => {
        let temp = {};
        if (curr.length && curr.length === 1) {
            temp = JSON.parse(JSON.stringify(curr[0]));
            temp.is_group = false;
            temp.is_expanded = false;
            temp.total_parts = 1;
            delete temp.partid;
        }
        else {
            const paySummary = curr?.reduce(summaryReducer, { amount_msat: 0, amount_sent_msat: 0, status: (curr[0] && curr[0].status) ? curr[0].status : 'failed' });
            temp = {
                is_group: true, is_expanded: false, total_parts: (curr.length ? curr.length : 0), status: paySummary.status, payment_hash: curr[0].payment_hash,
                destination: curr[0].destination, amount_msat: paySummary.amount_msat, amount_sent_msat: paySummary.amount_sent_msat, created_at: curr[0].created_at,
                mpps: curr
            };
            if (paySummary.bolt11) {
                temp.bolt11 = paySummary.bolt11;
            }
            if (paySummary.bolt12) {
                temp.bolt12 = paySummary.bolt12;
            }
        }
        return acc.concat(temp);
    }, []);
}
export const listPayments = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'List Payments..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/listsendpays';
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Payments', msg: 'Payment List Received', data: body.payments });
        body.payments = body.payments && body.payments.length && body.payments.length > 0 ? groupBy(body.payments) : [];
        return Promise.all(body.payments?.map((payment) => ((payment.bolt11) ? getMemo(req.session.selectedNode, payment) : (payment.memo = '')))).then((values) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payments List with Memo Received', data: body.payments });
            res.status(200).json(body.payments);
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'List Payments Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const postPayment = (req, res, next) => {
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    const options_body = JSON.parse(JSON.stringify(req.body));
    if (req.body.paymentType === 'KEYSEND') {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Keysend Payment..' });
        options.url = req.session.selectedNode.ln_server_url + '/v1/keysend';
        delete options_body.uiMessage;
        delete options_body.fromDialog;
        delete options_body.paymentType;
        delete options_body.title;
        delete options_body.issuer;
        delete options_body.bolt11;
        delete options_body.description;
        delete options_body.bolt12;
        delete options_body.zeroAmtOffer;
        delete options_body.pubkey;
        delete options_body.riskfactor;
        delete options_body.localinvreqid;
        delete options_body.exclude;
        delete options_body.maxfee;
        delete options_body.saveToDB;
        options.body = options_body;
    }
    else {
        if (req.body.paymentType === 'OFFER') {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Sending Offer Payment..' });
        }
        else {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Sending Invoice Payment..' });
        }
        if (req.body.paymentType === 'OFFER') {
            // delete amount for zero amt offer also as fetchinvoice already has amount information
            delete options_body.amount_msat;
        }
        delete options_body.uiMessage;
        delete options_body.fromDialog;
        delete options_body.paymentType;
        delete options_body.destination;
        delete options_body.extratlvs;
        delete options_body.title;
        delete options_body.issuer;
        delete options_body.bolt12;
        delete options_body.zeroAmtOffer;
        delete options_body.pubkey;
        delete options_body.saveToDB;
        options.body = options_body;
        options.url = req.session.selectedNode.ln_server_url + '/v1/pay';
    }
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Payments', msg: 'Payment Sent', data: body });
        if (req.body.paymentType === 'OFFER') {
            if (req.body.saveToDB && req.body.bolt12) {
                const offerToUpdate = { bolt12: req.body.bolt12, amountMSat: (req.body.zeroAmtOffer ? 0 : req.body.amount_msat), title: req.body.title, lastUpdatedAt: new Date(Date.now()).getTime() };
                if (req.body.issuer) {
                    offerToUpdate['issuer'] = req.body.issuer;
                }
                if (req.body.description) {
                    offerToUpdate['description'] = req.body.description;
                }
                // eslint-disable-next-line arrow-body-style
                return databaseService.validateDocument(CollectionsEnum.OFFERS, offerToUpdate).then((validated) => {
                    return databaseService.update(req.session.selectedNode, CollectionsEnum.OFFERS, offerToUpdate, CollectionFieldsEnum.BOLT12, req.body.bolt12).then((updatedOffer) => {
                        logger.log({ level: 'DEBUG', fileName: 'Payments', msg: 'Offer Updated', data: updatedOffer });
                        return res.status(201).json({ paymentResponse: body, saveToDBResponse: updatedOffer });
                    }).catch((errDB) => {
                        logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Payments', msg: 'Offer DB update error', error: errDB });
                        return res.status(201).json({ paymentResponse: body, saveToDBError: errDB });
                    });
                }).catch((errValidation) => {
                    logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Payments', msg: 'Offer DB validation error', error: errValidation });
                    return res.status(201).json({ paymentResponse: body, saveToDBError: errValidation });
                });
            }
            else {
                return res.status(201).json({ paymentResponse: body, saveToDBResponse: 'NA' });
            }
        }
        if (req.body.paymentType === 'INVOICE') {
            return res.status(201).json({ paymentResponse: body, saveToDBResponse: 'NA' });
        }
        if (req.body.paymentType === 'KEYSEND') {
            return res.status(201).json(body);
        }
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Payments', 'Send Payment Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

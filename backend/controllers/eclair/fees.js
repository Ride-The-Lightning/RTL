import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const arrangeFees = (selNode, body, current_time) => {
    const fees = { daily_fee: 0, daily_txs: 0, weekly_fee: 0, weekly_txs: 0, monthly_fee: 0, monthly_txs: 0 };
    const week_start_time = current_time - 604800000;
    const day_start_time = current_time - 86400000;
    let fee = 0;
    body.relayed.forEach((relayedEle) => {
        fee = Math.round((relayedEle.amountIn - relayedEle.amountOut) / 1000);
        const relayedEleTimestamp = relayedEle.settledAt ? relayedEle.settledAt : relayedEle.timestamp;
        if (relayedEleTimestamp) {
            if (relayedEleTimestamp.unix) {
                if ((relayedEleTimestamp.unix * 1000) >= day_start_time) {
                    fees.daily_fee = fees.daily_fee + fee;
                    fees.daily_txs = fees.daily_txs + 1;
                }
                if ((relayedEleTimestamp.unix * 1000) >= week_start_time) {
                    fees.weekly_fee = fees.weekly_fee + fee;
                    fees.weekly_txs = fees.weekly_txs + 1;
                }
            }
            else {
                if (relayedEleTimestamp >= day_start_time) {
                    fees.daily_fee = fees.daily_fee + fee;
                    fees.daily_txs = fees.daily_txs + 1;
                }
                if (relayedEleTimestamp >= week_start_time) {
                    fees.weekly_fee = fees.weekly_fee + fee;
                    fees.weekly_txs = fees.weekly_txs + 1;
                }
            }
        }
        fees.monthly_fee = fees.monthly_fee + fee;
        fees.monthly_txs = fees.monthly_txs + 1;
    });
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Fees', msg: 'Arranged Fee Received', data: fees });
    return fees;
};
export const arrangePayments = (selNode, body) => {
    const payments = {
        sent: body && body.sent ? body.sent : [],
        received: body && body.received ? body.received : [],
        relayed: body && body.relayed ? body.relayed : []
    };
    payments.sent.forEach((sentEle) => {
        if (sentEle.recipientAmount) {
            sentEle.recipientAmount = Math.round(sentEle.recipientAmount / 1000);
        }
        sentEle.parts.forEach((part) => {
            if (part.amount) {
                part.amount = Math.round(part.amount / 1000);
            }
            if (part.feesPaid) {
                part.feesPaid = Math.round(part.feesPaid / 1000);
            }
            if (part.timestamp.unix) {
                part.timestamp = part.timestamp.unix * 1000;
            }
        });
        if (sentEle.parts && sentEle.parts.length > 0) {
            sentEle.firstPartTimestamp = sentEle.parts[0].timestamp;
        }
    });
    payments.received.forEach((receivedEle) => {
        receivedEle.parts.forEach((part) => {
            if (part.amount) {
                part.amount = Math.round(part.amount / 1000);
            }
            if (part.timestamp.unix) {
                part.timestamp = part.timestamp.unix * 1000;
            }
        });
        if (receivedEle.parts && receivedEle.parts.length > 0) {
            receivedEle.firstPartTimestamp = receivedEle.parts[0].timestamp;
        }
    });
    payments.relayed.forEach((relayedEle) => {
        // Changing the timestamp value to keep the response backward compatible.
        // ECL < 0.7.0 sent timestamp in unix milliseconds, then in {"iso", "unix"} object.
        // From v0.10.0, it sends settledAt in {"iso", "unix"} object too.
        relayedEle.timestamp = relayedEle.settledAt && relayedEle.settledAt.unix ? relayedEle.settledAt.unix * 1000 : relayedEle.timestamp && relayedEle.timestamp.unix ? relayedEle.timestamp.unix * 1000 : relayedEle.timestamp;
        if (relayedEle.amountIn) {
            relayedEle.amountIn = Math.round(relayedEle.amountIn / 1000);
        }
        if (relayedEle.amountOut) {
            relayedEle.amountOut = Math.round(relayedEle.amountOut / 1000);
        }
    });
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Fees', msg: 'Arranged Payments Received', data: payments });
    return payments;
};
export const getFees = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Fees', msg: 'Getting Fees..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/audit';
    const today = new Date(Date.now());
    const tillToday = (Math.round(today.getTime() / 1000)).toString();
    const fromLastMonth = (Math.round(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() + 1, 0, 0, 0).getTime() / 1000)).toString();
    options.form = {
        from: fromLastMonth,
        to: tillToday
    };
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Fees', msg: 'Fee Audit Options', data: options.form });
    if (common.read_dummy_data) {
        common.getDummyData('Fees', req.session.selectedNode.lnImplementation).then((data) => { res.status(200).json(arrangeFees(req.session.selectedNode, data, Math.round((new Date().getTime())))); });
    }
    else {
        request.post(options).then((body) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Fees', msg: 'Fee Received', data: body });
            res.status(200).json(arrangeFees(req.session.selectedNode, body, Math.round((new Date().getTime()))));
        }).catch((errRes) => {
            const err = common.handleError(errRes, 'Fees', 'Get Fees Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
};
export const getPayments = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Fees', msg: 'Getting Payments..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/audit';
    const tillToday = (Math.round(new Date(Date.now()).getTime() / 1000)).toString();
    options.form = { from: 0, to: tillToday };
    if (common.read_dummy_data) {
        common.getDummyData('Payments', req.session.selectedNode.lnImplementation).then((data) => { res.status(200).json(arrangePayments(req.session.selectedNode, data)); });
    }
    else {
        request.post(options).then((body) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Fees', msg: 'Payments Received', data: body });
            res.status(200).json(arrangePayments(req.session.selectedNode, body));
        }).
            catch((errRes) => {
            const err = common.handleError(errRes, 'Fees', 'Get Payments Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
};

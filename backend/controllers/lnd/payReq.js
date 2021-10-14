import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const decodePaymentFromPaymentRequest = (payment) => {
    options.url = common.getSelLNServerUrl() + '/v1/payreq/' + payment;
    return request(options).then((res) => {
        logger.log({ level: 'DEBUG', fileName: 'PayReq', msg: 'Description', data: res.description });
        return res;
    }).catch((err) => { });
};
export const decodePayment = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'PayRequest', msg: 'Decoding Payment..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/payreq/' + req.params.payRequest;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'PayReq', msg: 'Payment Decode Received', data: body });
        logger.log({ level: 'INFO', fileName: 'PayRequest', msg: 'Payment Decoded' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'PayRequest', 'Decode Payment Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const decodePayments = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'PayRequest', msg: 'Decoding Payments List..' });
    options = common.getOptions();
    if (req.body.payments) {
        const paymentsArr = req.body.payments.split(',');
        return Promise.all(paymentsArr.map((payment) => decodePaymentFromPaymentRequest(payment))).
            then((values) => {
            logger.log({ level: 'DEBUG', fileName: 'PayReq', msg: 'Decoded Payments', data: values });
            logger.log({ level: 'INFO', fileName: 'PayRequest', msg: 'Payment List Decoded' });
            res.status(200).json(values);
        }).
            catch((errRes) => {
            const err = common.handleError(errRes, 'PayRequest', 'Decode Payments Error');
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }
    else {
        logger.log({ level: 'INFO', fileName: 'PayRequest', msg: 'Empty Payment List Decoded' });
        return res.status(200).json([]);
    }
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addInvoice = exports.listInvoices = exports.deleteExpiredInvoice = void 0;
const request = require("request-promise");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
let options = null;
const logger = logger_1.Logger;
const common = common_1.Common;
const deleteExpiredInvoice = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Invoices', msg: 'Deleting Expired Invoices..' });
    options = common.getOptions();
    const queryStr = req.query.maxExpiry ? '?maxexpiry=' + req.query.maxExpiry : '';
    options.url = common.getSelLNServerUrl() + '/v1/invoice/delExpiredInvoice' + queryStr;
    request.delete(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices Deleted', data: body });
        logger.log({ level: 'INFO', fileName: 'Invoices', msg: 'Expired Invoices Deleted' });
        res.status(204).json({ status: 'Invoice Deleted Successfully' });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoice', 'Delete Invoice Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.deleteExpiredInvoice = deleteExpiredInvoice;
const listInvoices = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Invoices', msg: 'Getting Invoices..' });
    options = common.getOptions();
    const labelQuery = req.query.label ? '?label=' + req.query.label : '';
    options.url = common.getSelLNServerUrl() + '/v1/invoice/listInvoices' + labelQuery;
    logger.log({ level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List URL', data: options.url });
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body });
        if (body.invoices && body.invoices.length > 0) {
            body.invoices = common.sortDescByKey(body.invoices, 'expires_at');
        }
        logger.log({ level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body });
        logger.log({ level: 'INFO', fileName: 'Invoices', msg: 'Invoices Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoice', 'List Invoices Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.listInvoices = listInvoices;
const addInvoice = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Invoices', msg: 'Creating Invoice..' });
    options = common.getOptions();
    options.url = common.getSelLNServerUrl() + '/v1/invoice/genInvoice';
    options.body = req.body;
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Invoice', msg: 'Add Invoice Responce', data: body });
        logger.log({ level: 'INFO', fileName: 'Invoices', msg: 'Invoice Created' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoice', 'Add Invoice Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.addInvoice = addInvoice;

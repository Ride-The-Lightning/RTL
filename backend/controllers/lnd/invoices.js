import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getInvoice = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Getting Invoice Information..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/invoice/' + req.params.rHashStr;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Invoice Info Received', data: body });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Information Received' });
        body.r_preimage = body.r_preimage ? Buffer.from(body.r_preimage, 'base64').toString('hex') : '';
        body.r_hash = body.r_hash ? Buffer.from(body.r_hash, 'base64').toString('hex') : '';
        body.description_hash = body.description_hash ? Buffer.from(body.description_hash, 'base64').toString('hex') : null;
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoices', 'Get Invoice Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listInvoices = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Getting List Invoices..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/invoices?num_max_invoices=' + req.query.num_max_invoices + '&index_offset=' + req.query.index_offset +
        '&reversed=' + req.query.reversed;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body });
        if (body.invoices && body.invoices.length > 0) {
            body.invoices.forEach((invoice) => {
                invoice.r_preimage = invoice.r_preimage ? Buffer.from(invoice.r_preimage, 'base64').toString('hex') : '';
                invoice.r_hash = invoice.r_hash ? Buffer.from(invoice.r_hash, 'base64').toString('hex') : '';
                invoice.description_hash = invoice.description_hash ? Buffer.from(invoice.description_hash, 'base64').toString('hex') : null;
            });
            body.invoices = common.sortDescByKey(body.invoices, 'creation_date');
        }
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoices List Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoices', 'List Invoices Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const addInvoice = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Adding Invoice..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.ln_server_url + '/v1/invoices';
    options.form = {
        memo: req.body.memo,
        private: req.body.private,
        expiry: req.body.expiry
    };
    if (req.body.amount > 0 && req.body.amount < 1) {
        options.form.value_msat = req.body.amount * 1000;
    }
    else {
        options.form.value = req.body.amount;
    }
    options.form = JSON.stringify(options.form);
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Add Invoice Responce', data: body });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Added' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoices', 'Add Invoice Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

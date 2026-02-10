import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { LNDWSClient } from './webSocketClient.js';
let options = null;
const logger = Logger;
const common = Common;
const lndWsClient = LNDWSClient;
const KEYSEND_MESSAGE_TLV_TYPE = '34349334';
const extractKeysendMessage = (invoice) => {
    if (invoice.is_keysend && (!invoice.memo || invoice.memo === '') && invoice.htlcs && invoice.htlcs.length > 0) {
        for (const htlc of invoice.htlcs) {
            if (htlc.custom_records && htlc.custom_records[KEYSEND_MESSAGE_TLV_TYPE]) {
                try {
                    return Buffer.from(htlc.custom_records[KEYSEND_MESSAGE_TLV_TYPE], 'base64').toString('utf8');
                }
                catch (err) {
                    return '';
                }
            }
        }
    }
    return invoice.memo || '';
};
export const invoiceLookup = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Getting Invoice Information..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v2/invoices/lookup';
    if (req.query.payment_addr) {
        options.url = options.url + '?payment_addr=' + req.query.payment_addr;
    }
    else {
        options.url = options.url + '?payment_hash=' + req.query.payment_hash;
    }
    request(options).then((body) => {
        body.r_preimage = body.r_preimage ? Buffer.from(body.r_preimage, 'base64').toString('hex') : '';
        body.r_hash = body.r_hash ? Buffer.from(body.r_hash, 'base64').toString('hex') : '';
        body.description_hash = body.description_hash ? Buffer.from(body.description_hash, 'base64').toString('hex') : null;
        body.memo = extractKeysendMessage(body);
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Information Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoices', 'Invoice Lookup Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listInvoices = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Getting List Invoices..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/invoices?num_max_invoices=' + req.query.num_max_invoices + '&index_offset=' + req.query.index_offset +
        '&reversed=' + req.query.reversed;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: body });
        if (body.invoices && body.invoices.length > 0) {
            body.invoices.forEach((invoice) => {
                invoice.r_preimage = invoice.r_preimage ? Buffer.from(invoice.r_preimage, 'base64').toString('hex') : '';
                invoice.r_hash = invoice.r_hash ? Buffer.from(invoice.r_hash, 'base64').toString('hex') : '';
                invoice.description_hash = invoice.description_hash ? Buffer.from(invoice.description_hash, 'base64').toString('hex') : null;
                invoice.memo = extractKeysendMessage(invoice);
            });
        }
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Sorted Invoices List Received', data: body });
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
    options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/invoices';
    options.form = JSON.stringify(req.body);
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Added', data: body });
        try {
            if (body.r_hash) {
                lndWsClient.subscribeToInvoice(options, req.session.selectedNode, body.r_hash);
            }
        }
        catch (errRes) {
            const err = common.handleError(errRes, 'Invoices', 'Subscribe to Newly Added Invoice Error', req.session.selectedNode);
            logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Invoice', msg: 'Subscribe to Newly Added Invoice Error', error: err });
        }
        body.r_preimage = body.r_preimage ? Buffer.from(body.r_preimage, 'base64').toString('hex') : '';
        body.r_hash = body.r_hash ? Buffer.from(body.r_hash, 'base64').toString('hex') : '';
        body.description_hash = body.description_hash ? Buffer.from(body.description_hash, 'base64').toString('hex') : null;
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Invoices', 'Add Invoice Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};

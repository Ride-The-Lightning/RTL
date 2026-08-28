import request from '../../utils/request.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { LNDWSClient, LNDWebSocketClient } from './webSocketClient.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
const lndWsClient: LNDWebSocketClient = LNDWSClient;

const KEYSEND_MESSAGE_TLV_TYPE = '34349334';

const extractKeysendMessage = (invoice) => {
  if (invoice.is_keysend && (!invoice.memo || invoice.memo === '') && invoice.htlcs && invoice.htlcs.length > 0) {
    for (const htlc of invoice.htlcs) {
      if (htlc.custom_records && htlc.custom_records[KEYSEND_MESSAGE_TLV_TYPE]) {
        try {
          return Buffer.from(htlc.custom_records[KEYSEND_MESSAGE_TLV_TYPE], 'base64').toString('utf8');
        } catch (err) {
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
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/v2/invoices/lookup';
  if (req.query.payment_addr) {
    options.url = options.url + '?payment_addr=' + req.query.payment_addr;
  } else {
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
  const qs: Record<string, any> = {};
  if (req.query.num_max_invoices !== undefined) {
    const raw = typeof req.query.num_max_invoices === 'string' ? req.query.num_max_invoices.trim() : '';
    if (raw === '' || !(/^\d+$/).test(raw)) {
      logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Invoice', msg: 'Invalid num_max_invoices query param' });
      return res.status(400).json({ message: 'num_max_invoices must be a non-negative integer', error: 'Invalid query parameter' });
    }
    const num = Number(raw);
    if (!Number.isSafeInteger(num)) {
      logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Invoice', msg: 'num_max_invoices exceeds safe integer range' });
      return res.status(400).json({ message: 'num_max_invoices exceeds maximum safe integer', error: 'Invalid query parameter' });
    }
    qs.num_max_invoices = num === 0 ? 100 : num;
  } else {
    qs.num_max_invoices = 100;
  }
  if (req.query.index_offset !== undefined) {
    const raw = typeof req.query.index_offset === 'string' ? req.query.index_offset.trim() : '';
    if (raw === '' || !(/^\d+$/).test(raw)) {
      logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Invoice', msg: 'Invalid index_offset query param' });
      return res.status(400).json({ message: 'index_offset must be a non-negative integer', error: 'Invalid query parameter' });
    }
    const num = Number(raw);
    if (!Number.isSafeInteger(num)) {
      logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Invoice', msg: 'index_offset exceeds safe integer range' });
      return res.status(400).json({ message: 'index_offset exceeds maximum safe integer', error: 'Invalid query parameter' });
    }
    qs.index_offset = num;
  }
  if (req.query.reversed !== undefined) {
    const raw = typeof req.query.reversed === 'string' ? req.query.reversed.trim().toLowerCase() : '';
    if (raw !== 'true' && raw !== 'false' && raw !== '1' && raw !== '0' && raw !== 't' && raw !== 'f') {
      logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Invoice', msg: 'Invalid reversed query param' });
      return res.status(400).json({ message: 'reversed must be a boolean', error: 'Invalid query parameter' });
    }
    qs.reversed = raw === 'true' || raw === '1' || raw === 't';
  }
  request({ ...options, url: req.session.selectedNode.settings.lnServerUrl + '/v1/invoices', qs }).then((body) => {
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
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/invoices';
  options.form = JSON.stringify(req.body);
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Added', data: body });
    try {
      if (body.r_hash) {
        lndWsClient.subscribeToInvoice(options, req.session.selectedNode, body.r_hash);
      }
    } catch (errRes) {
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
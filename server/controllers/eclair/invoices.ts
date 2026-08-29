import request from '../../utils/request.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { SelectedNode } from '../../models/config.model.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

// Page-size bounds for listInvoices. Every invoice on a page costs one /getreceivedinfo
// round trip to eclair, so the cap is what keeps that fan-out bounded; 100 matches the
// largest page the UI offers.
export const DEFAULT_INVOICE_PAGE_SIZE = 10;
export const MAX_INVOICE_PAGE_SIZE = 100;

// Eclair returns the status of an invoice as pending (unpaid, not yet expired), received or
// expired; RTL's UI calls the first of those 'unpaid'.
export const getReceivedPaymentInfo = (baseOptions, lnServerUrl, invoice) => {
  invoice.expiresAt = (!invoice.expiry) ? null : (+invoice.timestamp + +invoice.expiry);
  if (invoice.amount) { invoice.amount = Math.round(invoice.amount / 1000); }
  const infoOptions = JSON.parse(JSON.stringify(baseOptions));
  infoOptions.url = lnServerUrl + '/getreceivedinfo';
  infoOptions.form = { paymentHash: invoice.paymentHash };
  return request(infoOptions).then((response) => {
    invoice.status = (response.status && response.status.type === 'pending') ? 'unpaid' : response.status.type;
    if (response.status && response.status.type === 'received') {
      invoice.amountSettled = response.status.amount ? Math.round(response.status.amount / 1000) : 0;
      invoice.receivedAt = response.status.receivedAt.unix ? response.status.receivedAt.unix : 0;
    }
    return invoice;
  }).catch((err) => {
    invoice.status = 'unknown';
    return invoice;
  });
};

// A non-negative integer given as a decimal string; anything else (hex, exponent, sign,
// fraction, repeated field) is rejected so it can never reach eclair or Number().
const parsePagingParam = (value) => {
  if (value === undefined) { return undefined; }
  if (typeof value !== 'string' || !(/^\d+$/).test(value.trim())) { return NaN; }
  const num = Number(value.trim());
  return Number.isSafeInteger(num) ? num : NaN;
};

const fetchInvoicePage = (baseOptions, lnServerUrl, from, to, count, skip) => {
  const pageOptions = JSON.parse(JSON.stringify(baseOptions));
  pageOptions.url = lnServerUrl + '/listinvoices';
  pageOptions.form = { from, to, count, skip };
  return request(pageOptions).then((invoices) => (Array.isArray(invoices) ? invoices : []));
};

// Eclair's listinvoices is oldest-first and never reports a total, so the newest page can only
// be addressed once the total is known. Derive it with single-row probes: gallop past the end,
// then bisect — O(log n) calls that each cost eclair one LIMIT 1 OFFSET n query, instead of
// the full-table fetch that pinned a node with hundreds of thousands of invoices (#1067).
export const countInvoices = (baseOptions, lnServerUrl, from, to): Promise<number> => {
  const hasInvoiceAt = (skip: number) => fetchInvoicePage(baseOptions, lnServerUrl, from, to, 1, skip).then((page) => page.length > 0);
  // `present` is an offset known to hold an invoice, `absent` one known to be past the end.
  const bisect = (present: number, absent: number): Promise<number> => {
    if (absent - present <= 1) { return Promise.resolve(absent); }
    const mid = present + Math.floor((absent - present) / 2);
    return hasInvoiceAt(mid).then((found) => (found ? bisect(mid, absent) : bisect(present, mid)));
  };
  const gallop = (present: number, absent: number): Promise<number> => hasInvoiceAt(absent).then((found) => (found ? gallop(absent, absent * 2) : bisect(present, absent)));
  return hasInvoiceAt(0).then((found) => (found ? gallop(0, 1) : 0));
};

export const getInvoice = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Invoice..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/getinvoice';
  options.form = { paymentHash: req.params.paymentHash };
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Found', data: body });
    const current_time = (Math.round(new Date(Date.now()).getTime() / 1000));
    body.amount = body.amount ? body.amount / 1000 : 0;
    body.expiresAt = body.expiresAt ? body.expiresAt : (body.timestamp + body.expiry);
    body.status = body.status ? body.status : (+body.expiresAt < current_time ? 'expired' : 'unknown');
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Invoices', 'Get Invoice Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listPendingInvoicesRequestCall = (selectedNode: SelectedNode, count?: number, skip?: number) => {
  logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'List Pending Invoices..' });
  options = selectedNode.authentication.options;
  options.url = selectedNode.settings.lnServerUrl + '/listpendinginvoices';
  options.form = { from: 0, to: (Math.round(new Date(Date.now()).getTime() / 1000)).toString() };
  // Limit the number of invoices till provided count
  if (count) { options.form.count = count; }
  if (skip) { options.form.skip = skip; }
  return new Promise((resolve, reject) => {
    request.post(options).then((pendingInvoicesResponse) => {
      logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Pending Invoices List ', data: pendingInvoicesResponse });
      resolve(pendingInvoicesResponse);
    }).catch((errRes) => {
      reject(common.handleError(errRes, 'Invoices', 'List Pending Invoices Error', selectedNode));
    });
  });
};

export const listInvoices = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Getting List Invoices..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  // `skip` is the offset from the newest invoice; `count` is the page size.
  const requestedCount = parsePagingParam(req.query.count);
  const requestedSkip = parsePagingParam(req.query.skip);
  if (Number.isNaN(requestedCount) || Number.isNaN(requestedSkip)) {
    logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Invoices', msg: 'Invalid count/skip query param' });
    return res.status(400).json({ message: 'count and skip must be non-negative integers', error: 'Invalid query parameter' });
  }
  const count = Math.min(requestedCount === undefined || requestedCount === 0 ? DEFAULT_INVOICE_PAGE_SIZE : requestedCount, MAX_INVOICE_PAGE_SIZE);
  const skip = requestedSkip || 0;
  const lnServerUrl = req.session.selectedNode.settings.lnServerUrl;
  const from = 0;
  const to = (Math.round(new Date(Date.now()).getTime() / 1000)).toString();
  const baseOptions = JSON.parse(JSON.stringify(options));
  if (common.read_dummy_data) {
    return common.getDummyData('Invoices', req.session.selectedNode.lnImplementation).then(([invoices]: any[]) => Promise.all(invoices?.map((invoice) => getReceivedPaymentInfo(baseOptions, lnServerUrl, invoice))).
      then((values) => res.status(200).json({ invoices: values, totalInvoices: values.length })));
  } else {
    return countInvoices(baseOptions, lnServerUrl, from, to).
      then((totalInvoices) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoices', msg: 'Total Invoices', data: totalInvoices });
        // Map the newest-first window onto eclair's oldest-first offsets.
        const pageCount = Math.min(count, totalInvoices - skip);
        if (pageCount <= 0) {
          logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Empty List Invoice Received' });
          return res.status(200).json({ invoices: [], totalInvoices });
        }
        const pageSkip = totalInvoices - skip - pageCount;
        return fetchInvoicePage(baseOptions, lnServerUrl, from, to, pageCount, pageSkip).
          then((invoices) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Invoice', msg: 'Invoices List Received', data: invoices });
            return Promise.all(invoices.reverse().map((invoice) => getReceivedPaymentInfo(baseOptions, lnServerUrl, invoice)));
          }).
          then((invoices) => {
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Sorted Invoices List Received', data: invoices });
            return res.status(200).json({ invoices, totalInvoices });
          });
      }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'Invoices', 'List Invoices Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  }
};

export const createInvoiceRequestCall = (selectedNode: SelectedNode, description: string, amount: number) => {
  logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Creating Invoice..' });
  options = selectedNode.authentication.options;
  options.url = selectedNode.settings.lnServerUrl + '/createinvoice';
  options.form = { description: description, amountMsat: amount };
  return new Promise((resolve, reject) => {
    request.post(options).then((invResponse) => {
      logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'Invoice', msg: 'Invoice Created', data: invResponse });
      if (invResponse.amount) { invResponse.amount = Math.round(invResponse.amount / 1000); }
      resolve(invResponse);
    }).catch((errRes) => {
      reject(common.handleError(errRes, 'Invoices', 'Create Invoice Error', selectedNode));
    });
  });
};

export const createInvoice = (req, res, next) => {
  const { description, amountMsat } = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Invoices', msg: 'Creating Invoice..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  createInvoiceRequestCall(req.session.selectedNode, description, amountMsat).then((invRes) => {
    res.status(201).json(invRes);
  }).catch((err) => res.status(err.statusCode).json({ message: err.message, error: err.error }));
};

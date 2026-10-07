import request from '../../utils/request.js';
import * as fs from 'fs';
import { join } from 'path';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
export class LNDWebSocketClient {
    constructor() {
        this.logger = Logger;
        this.common = Common;
        this.wsServer = WSServer;
        this.webSocketClients = [];
        // Invoice subscriptions currently open, keyed '<node index>:<r_hash>', with the server URL
        // each was opened against. Every getinfo asks for the node's open invoices and subscribes to
        // each, and a new invoice is subscribed when it is added, so without this each call opened
        // another unbounded long poll per invoice.
        this.openInvoiceSubscriptions = new Map();
        // A long poll can die without its connection closing (a NAT or proxy dropping it), and then
        // it never settles. Past this age the next getinfo aborts it: it subscribes again to an
        // invoice that is still open, and drops one that no longer is.
        this.invoiceSubscriptionMaxAgeMs = 10 * 60 * 1000;
        // The pending invoices are listed one page at a time; ask for this many explicitly so a full
        // page can be told apart from a complete list.
        this.pendingInvoicesPageSize = 100;
        this.invoiceSubscriptionKey = (selectedNode, rHash) => selectedNode.index + ':' + rHash?.replace(/\+/g, '-')?.replace(/[/]/g, '_');
        this.connect = (selectedNode) => {
            try {
                const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
                if (!clientExists && selectedNode.settings.lnServerUrl) {
                    const newWebSocketClient = { selectedNode: selectedNode };
                    this.webSocketClients.push(newWebSocketClient);
                }
            }
            catch (err) {
                throw new Error(err);
            }
        };
        this.fetchUnpaidInvoices = (selectedNode) => {
            this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Getting Unpaid Invoices..' });
            const options = this.setOptionsForSelNode(selectedNode);
            options.url = selectedNode.settings.lnServerUrl + '/v1/invoices?pending_only=true&num_max_invoices=' + this.pendingInvoicesPageSize;
            return request(options).then((body) => {
                this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Unpaid Invoices Received', data: body });
                if (body.invoices && body.invoices.length > 0) {
                    body.invoices.forEach((invoice) => {
                        if (invoice.state === 'OPEN') {
                            this.subscribeToInvoice(options, selectedNode, invoice.r_hash);
                        }
                    });
                }
                // A full page may leave pending invoices out, so only a shorter one says what is no longer
                // pending. On a node whose pending list always fills the page, a stream that hung and whose
                // invoice was then settled or cancelled is therefore not dropped and stays until restart;
                // paging through the whole list would close that gap.
                if ((body.invoices || []).length < this.pendingInvoicesPageSize) {
                    this.dropExpiredInvoiceSubscriptions(selectedNode, body.invoices || []);
                }
                return null;
            }).catch((errRes) => {
                const err = this.common.handleError(errRes, 'WebSocketClient', 'Pending Invoices Error', selectedNode);
                return ({ message: err.message, error: err.error });
            });
        };
        // A stream for an invoice the node no longer lists as pending is never asked about again, so
        // one that hung would stay forever. Drop it once past the age limit; a younger one is left to
        // end by itself, as it may be about to deliver the invoice's settle.
        this.dropExpiredInvoiceSubscriptions = (selectedNode, pendingInvoices) => {
            const pending = new Set(pendingInvoices.map((invoice) => this.invoiceSubscriptionKey(selectedNode, invoice.r_hash)));
            const nodePrefix = selectedNode.index + ':';
            this.openInvoiceSubscriptions.forEach((open, key) => {
                if (key.startsWith(nodePrefix) && !pending.has(key) && Date.now() - open.openedAt >= this.invoiceSubscriptionMaxAgeMs) {
                    this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Dropping Subscription to Invoice No Longer Pending ' + key.slice(nodePrefix.length) });
                    this.openInvoiceSubscriptions.delete(key);
                    open.controller.abort();
                }
            });
        };
        this.subscribeToInvoice = (options, selectedNode, rHash) => {
            rHash = rHash?.replace(/\+/g, '-')?.replace(/[/]/g, '_');
            const subscriptionKey = this.invoiceSubscriptionKey(selectedNode, rHash);
            const url = selectedNode.settings.lnServerUrl;
            const open = this.openInvoiceSubscriptions.get(subscriptionKey);
            if (open) {
                if (open.url === url && Date.now() - open.openedAt < this.invoiceSubscriptionMaxAgeMs) {
                    this.logger.log({ selectedNode: selectedNode, level: 'DEBUG', fileName: 'WebSocketClient', msg: 'Already Subscribed to Invoice ' + rHash });
                    return;
                }
                // Too old to trust, or opened against a server URL the node no longer uses.
                this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Replacing Subscription to Invoice ' + rHash });
                open.controller.abort();
            }
            // Forget the subscription once its long poll ends, however it ends, so a later getinfo
            // subscribes again to an invoice that is still open; a replaced one leaves the new entry.
            const subscription = { openedAt: Date.now(), controller: new AbortController(), url: url };
            this.openInvoiceSubscriptions.set(subscriptionKey, subscription);
            const ended = () => {
                if (this.openInvoiceSubscriptions.get(subscriptionKey) === subscription) {
                    this.openInvoiceSubscriptions.delete(subscriptionKey);
                }
            };
            this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Subscribing to Invoice ' + rHash + ' ..' });
            // Copy the options: the caller may pass the session-cached object, and the
            // long poll needs an unbounded timeout without leaking it to other calls.
            options = { ...options, url: url + '/v2/invoices/subscribe/' + rHash, timeout: 0, signal: subscription.controller.signal };
            request(options).then((msg) => {
                ended();
                this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Invoice Information Received for ' + rHash });
                if (typeof msg === 'string') {
                    const results = msg.split('\n');
                    msg = (results.length && results.length > 1) ? JSON.parse(results[1]) : JSON.parse(msg);
                    msg.result.r_preimage = msg.result.r_preimage ? Buffer.from(msg.result.r_preimage, 'base64').toString('hex') : '';
                    msg.result.r_hash = msg.result.r_hash ? Buffer.from(msg.result.r_hash, 'base64').toString('hex') : '';
                    msg.result.description_hash = msg.result.description_hash ? Buffer.from(msg.result.description_hash, 'base64').toString('hex') : null;
                }
                msg['type'] = 'invoice';
                msg['source'] = 'LND';
                const msgStr = JSON.stringify(msg);
                this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Invoice Info Received', data: msgStr });
                this.wsServer.sendEventsToAllLNClients(msgStr, selectedNode);
            }).catch((errRes) => {
                ended();
                // Aborted on purpose (replaced, or dropped as no longer pending): not an error to report.
                if (subscription.controller.signal.aborted) {
                    return;
                }
                const err = this.common.handleError(errRes, 'Invoices', 'Subscribe to Invoice Error for ' + rHash, selectedNode);
                const errStr = ((typeof err === 'object' && err.message) ? JSON.stringify({ error: err.message + ' ' + rHash }) : (typeof err === 'object') ? JSON.stringify({ error: err + ' ' + rHash }) : ('{ "error": ' + err + ' ' + rHash + ' }'));
                this.wsServer.sendErrorToAllLNClients(errStr, selectedNode);
            });
        };
        this.subscribeToPayment = (options, selectedNode, paymentHash) => {
            this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Subscribing to Payment ' + paymentHash + ' ..' });
            // Copy the options: the long poll needs an unbounded timeout without
            // leaking it to other calls sharing the object.
            options = { ...options, url: selectedNode.settings.lnServerUrl + '/v2/router/track/' + paymentHash, timeout: 0 };
            request(options).then((msg) => {
                this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Payment Information Received for ' + paymentHash });
                msg['type'] = 'payment';
                msg['source'] = 'LND';
                const msgStr = JSON.stringify(msg);
                this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Payment Info Received', data: msgStr });
                this.wsServer.sendEventsToAllLNClients(msgStr, selectedNode);
            }).catch((errRes) => {
                const err = this.common.handleError(errRes, 'Payment', 'Subscribe to Payment Error for ' + paymentHash, selectedNode);
                const errStr = ((typeof err === 'object' && err.message) ? JSON.stringify({ error: err.message + ' ' + paymentHash }) : (typeof err === 'object') ? JSON.stringify({ error: err + ' ' + paymentHash }) : ('{ "error": ' + err + ' ' + paymentHash + ' }'));
                this.wsServer.sendErrorToAllLNClients(errStr, selectedNode);
            });
        };
        this.setOptionsForSelNode = (selectedNode) => {
            const options = { url: '', rejectUnauthorized: false, json: true, form: null };
            try {
                options['headers'] = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(selectedNode.authentication.macaroonPath, 'admin.macaroon')).toString('hex') };
            }
            catch (err) {
                this.logger.log({ selectedNode: selectedNode, level: 'ERROR', fileName: 'WebSocketClient', msg: 'Set Options Error', error: JSON.stringify(err) });
            }
            return options;
        };
        this.disconnect = (selectedNode) => {
            const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
            if (clientExists) {
                this.logger.log({ selectedNode: clientExists.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Disconnecting from the LND\'s Websocket Server..' });
                const clientIdx = this.webSocketClients.findIndex((wsc) => wsc.selectedNode.index === selectedNode.index);
                this.webSocketClients.splice(clientIdx, 1);
            }
        };
        this.updateSelectedNode = (newSelectedNode) => {
            const clientIdx = this.webSocketClients.findIndex((wsc) => +wsc.selectedNode.index === +newSelectedNode.index);
            let newClient = this.webSocketClients[clientIdx];
            if (!newClient) {
                newClient = { selectedNode: null };
            }
            newClient.selectedNode = JSON.parse(JSON.stringify(newSelectedNode));
            this.webSocketClients[clientIdx] = newClient;
            if (this.webSocketClients[clientIdx].selectedNode.lnVersion === '' || !this.webSocketClients[clientIdx].selectedNode.lnVersion || this.common.isVersionCompatible(this.webSocketClients[clientIdx].selectedNode.lnVersion, '0.11.0')) {
                this.fetchUnpaidInvoices(this.webSocketClients[clientIdx].selectedNode);
            }
        };
        this.wsServer.eventEmitterLND.on('CONNECT', (nodeIndex) => {
            this.connect(this.common.findNode(+nodeIndex));
        });
        this.wsServer.eventEmitterLND.on('DISCONNECT', (nodeIndex) => {
            this.disconnect(this.common.findNode(+nodeIndex));
        });
    }
}
export const LNDWSClient = new LNDWebSocketClient();

import request from '../../utils/request.js';
import * as fs from 'fs';
import { join } from 'path';

import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { WSServer } from '../../utils/webSocketServer.js';
import { SelectedNode } from '../../models/config.model.js';

export class LNDWebSocketClient {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public wsServer = WSServer;
  public webSocketClients: Array<{ selectedNode: SelectedNode }> = [];
  // Invoice subscriptions currently open, keyed '<node index>:<server url>:<r_hash>'. Every
  // getinfo asks for the node's open invoices and subscribes to each, and a new invoice is
  // subscribed when it is added, so without this each call opened another unbounded long poll
  // per invoice.
  private openInvoiceSubscriptions = new Map<string, { openedAt: number, controller: AbortController }>();
  // A long poll can die without its connection closing (a NAT or proxy dropping it), and then
  // it never settles. Past this age the next getinfo aborts it and subscribes again.
  private invoiceSubscriptionMaxAgeMs = 10 * 60 * 1000;

  constructor() {
    this.wsServer.eventEmitterLND.on('CONNECT', (nodeIndex) => {
      this.connect(this.common.findNode(+nodeIndex));
    });
    this.wsServer.eventEmitterLND.on('DISCONNECT', (nodeIndex) => {
      this.disconnect(this.common.findNode(+nodeIndex));
    });
  }

  public connect = (selectedNode: SelectedNode) => {
    try {
      const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
      if (!clientExists && selectedNode.settings.lnServerUrl) {
        const newWebSocketClient = { selectedNode: selectedNode };
        this.webSocketClients.push(newWebSocketClient);
      }
    } catch (err: any) {
      throw new Error(err);
    }
  };

  public fetchUnpaidInvoices = (selectedNode: SelectedNode) => {
    this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Getting Unpaid Invoices..' });
    const options = this.setOptionsForSelNode(selectedNode);
    options.url = selectedNode.settings.lnServerUrl + '/v1/invoices?pending_only=true';
    return request(options).then((body) => {
      this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Unpaid Invoices Received', data: body });
      if (body.invoices && body.invoices.length > 0) {
        body.invoices.forEach((invoice) => {
          if (invoice.state === 'OPEN') {
            this.subscribeToInvoice(options, selectedNode, invoice.r_hash);
          }
        });
      }
      return null;
    }).catch((errRes) => {
      const err = this.common.handleError(errRes, 'WebSocketClient', 'Pending Invoices Error', selectedNode);
      return ({ message: err.message, error: err.error });
    });
  };

  public subscribeToInvoice = (options: any, selectedNode: SelectedNode, rHash: string) => {
    rHash = rHash?.replace(/\+/g, '-')?.replace(/[/]/g, '_');
    const subscriptionKey = selectedNode.index + ':' + selectedNode.settings.lnServerUrl + ':' + rHash;
    const open = this.openInvoiceSubscriptions.get(subscriptionKey);
    if (open) {
      if (Date.now() - open.openedAt < this.invoiceSubscriptionMaxAgeMs) {
        this.logger.log({ selectedNode: selectedNode, level: 'DEBUG', fileName: 'WebSocketClient', msg: 'Already Subscribed to Invoice ' + rHash });
        return;
      }
      this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Replacing Subscription to Invoice ' + rHash });
      open.controller.abort();
    }
    // Forget the subscription once its long poll ends, however it ends, so a later getinfo
    // subscribes again to an invoice that is still open; a replaced one leaves the new entry.
    const subscription = { openedAt: Date.now(), controller: new AbortController() };
    this.openInvoiceSubscriptions.set(subscriptionKey, subscription);
    const ended = () => {
      if (this.openInvoiceSubscriptions.get(subscriptionKey) === subscription) { this.openInvoiceSubscriptions.delete(subscriptionKey); }
    };
    this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Subscribing to Invoice ' + rHash + ' ..' });
    // Copy the options: the caller may pass the session-cached object, and the
    // long poll needs an unbounded timeout without leaking it to other calls.
    options = { ...options, url: selectedNode.settings.lnServerUrl + '/v2/invoices/subscribe/' + rHash, timeout: 0, signal: subscription.controller.signal };
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
      // Aborted because a newer subscription replaced it: not an error to report.
      if (subscription.controller.signal.aborted) { return; }
      const err = this.common.handleError(errRes, 'Invoices', 'Subscribe to Invoice Error for ' + rHash, selectedNode);
      const errStr = ((typeof err === 'object' && err.message) ? JSON.stringify({ error: err.message + ' ' + rHash }) : (typeof err === 'object') ? JSON.stringify({ error: err + ' ' + rHash }) : ('{ "error": ' + err + ' ' + rHash + ' }'));
      this.wsServer.sendErrorToAllLNClients(errStr, selectedNode);
    });
  };

  public subscribeToPayment = (options: any, selectedNode: SelectedNode, paymentHash: string) => {
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

  public setOptionsForSelNode = (selectedNode: SelectedNode) => {
    const options = { url: '', rejectUnauthorized: false, json: true, form: null };
    try {
      options['headers'] = { 'Grpc-Metadata-macaroon': fs.readFileSync(join(selectedNode.authentication.macaroonPath, 'admin.macaroon')).toString('hex') };
    } catch (err) {
      this.logger.log({ selectedNode: selectedNode, level: 'ERROR', fileName: 'WebSocketClient', msg: 'Set Options Error', error: JSON.stringify(err) });
    }
    return options;
  };

  public disconnect = (selectedNode: SelectedNode) => {
    const clientExists = this.webSocketClients.find((wsc) => wsc.selectedNode.index === selectedNode.index);
    if (clientExists) {
      this.logger.log({ selectedNode: clientExists.selectedNode, level: 'INFO', fileName: 'CLWebSocket', msg: 'Disconnecting from the LND\'s Websocket Server..' });
      const clientIdx = this.webSocketClients.findIndex((wsc) => wsc.selectedNode.index === selectedNode.index);
      this.webSocketClients.splice(clientIdx, 1);
    }
  };

  public updateSelectedNode = (newSelectedNode: SelectedNode) => {
    const clientIdx = this.webSocketClients.findIndex((wsc) => +wsc.selectedNode.index === +newSelectedNode.index);
    let newClient = this.webSocketClients[clientIdx];
    if (!newClient) { newClient = { selectedNode: null }; }
    newClient.selectedNode = JSON.parse(JSON.stringify(newSelectedNode));
    this.webSocketClients[clientIdx] = newClient;
    if (this.webSocketClients[clientIdx].selectedNode.lnVersion === '' || !this.webSocketClients[clientIdx].selectedNode.lnVersion || this.common.isVersionCompatible(this.webSocketClients[clientIdx].selectedNode.lnVersion, '0.11.0')) {
      this.fetchUnpaidInvoices(this.webSocketClients[clientIdx].selectedNode);
    }
  };

}

export const LNDWSClient = new LNDWebSocketClient();

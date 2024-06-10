import request from 'request-promise';
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
    this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Subscribing to Invoice ' + rHash + ' ..' });
    options.url = selectedNode.settings.lnServerUrl + '/v2/invoices/subscribe/' + rHash;
    request(options).then((msg) => {
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
      const err = this.common.handleError(errRes, 'Invoices', 'Subscribe to Invoice Error for ' + rHash, selectedNode);
      const errStr = ((typeof err === 'object' && err.message) ? JSON.stringify({ error: err.message + ' ' + rHash }) : (typeof err === 'object') ? JSON.stringify({ error: err + ' ' + rHash }) : ('{ "error": ' + err + ' ' + rHash + ' }'));
      this.wsServer.sendErrorToAllLNClients(errStr, selectedNode);
    });
  };

  public subscribeToPayment = (options: any, selectedNode: SelectedNode, paymentHash: string) => {
    this.logger.log({ selectedNode: selectedNode, level: 'INFO', fileName: 'WebSocketClient', msg: 'Subscribing to Payment ' + paymentHash + ' ..' });
    options.url = selectedNode.settings.lnServerUrl + '/v2/router/track/' + paymentHash;
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

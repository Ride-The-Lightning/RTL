import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';

import { LoggerService } from '../../shared/services/logger.service';
import { SessionService } from './session.service';

@Injectable()
export class WebSocketClientService implements OnDestroy {

  public clWSMessages: BehaviorSubject<any> = new BehaviorSubject(null);
  public eclWSMessages: BehaviorSubject<any> = new BehaviorSubject(null);
  private wsUrl = '';
  private nodeImplementation = '';
  private nodeIndex = '';
  private socket: WebSocketSubject<any> | null;
  private RETRY_SECONDS = 5;
  private RECONNECT_TIMEOUT = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private sessionService: SessionService) { }

  connectWebSocket(finalWSUrl: string, nodeLnImplementation: string, nodeIndex: string) {
    if (!this.socket || this.socket.closed) {
      this.wsUrl = finalWSUrl;
      this.nodeImplementation = nodeLnImplementation;
      this.nodeIndex = nodeIndex;
      this.logger.info('Websocket Url: ' + this.wsUrl);
      this.socket = new WebSocketSubject({
        url: finalWSUrl,
        protocol: [this.sessionService.getItem('token'), nodeLnImplementation, nodeIndex]
      });
      this.subscribeToMessages();
    }
  }

  reconnectOnError() {
    if (this.RECONNECT_TIMEOUT || (this.socket && !this.socket.closed)) { return; }
    this.RETRY_SECONDS = (this.RETRY_SECONDS >= 160) ? 160 : (this.RETRY_SECONDS * 2);
    this.RECONNECT_TIMEOUT = setTimeout(() => {
      this.logger.info('Reconnecting Web Socket.');
      this.connectWebSocket(this.wsUrl, this.nodeImplementation, this.nodeIndex);
      this.RECONNECT_TIMEOUT = null;
    }, this.RETRY_SECONDS * 1000);
  }

  closeConnection() {
    if (this.socket) {
      this.socket.complete();
      this.socket = null;
    }
  }

  private subscribeToMessages() {
    this.socket.pipe(takeUntil(this.unSubs[1])).subscribe({
      next: (msg) => {
        msg = (typeof msg === 'string') ? JSON.parse(msg) : msg;
        if (msg.error) {
          this.handleError(msg.error);
        } else {
          this.logger.info('Next Message from WS:' + JSON.stringify(msg));
          switch (msg.source) {
            case 'LND':
              break;
            case 'CLT':
              this.clWSMessages.next(msg);
              break;
            case 'ECL':
              this.eclWSMessages.next(msg);
              break;
            default:
              break;
          }
        }
      },
      error: (err) => this.handleError(err),
      complete: () => { this.logger.info('Web Socket Closed'); }
    });
  }

  private handleError(err) {
    this.logger.error(err);
    this.clWSMessages.error(err);
    this.eclWSMessages.error(err);
    this.reconnectOnError();
  }

  ngOnDestroy() {
    this.closeConnection();
    this.clWSMessages.next(null);
    this.clWSMessages.complete();
    this.eclWSMessages.next(null);
    this.eclWSMessages.complete();
  }

}

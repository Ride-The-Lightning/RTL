import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';

import { LoggerService } from '../../shared/services/logger.service';
import { SessionService } from './session.service';

@Injectable()
export class WebSocketClientService implements OnDestroy {

  public clWSMessages: BehaviorSubject<any> = new BehaviorSubject(null);
  public eclWSMessages: BehaviorSubject<any> = new BehaviorSubject(null);
  public lndWSMessages: BehaviorSubject<any> = new BehaviorSubject(null);
  private wsUrl = '';
  private nodeIndex = '';
  private socket: WebSocketSubject<any> | null;
  private RETRY_SECONDS = 5;
  private RECONNECT_TIMEOUT: any = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private sessionService: SessionService) { }

  connectWebSocket(finalWSUrl: string, nodeIndex: string) {
    // A node switch keeps the open socket (the server moves it to the new node), so keep the
    // node it names for when it reopens.
    this.wsUrl = finalWSUrl;
    this.nodeIndex = nodeIndex;
    if (!this.socket || this.socket.closed) {
      this.logger.info('Websocket Url: ' + this.wsUrl);
      const token = this.sessionService.getItem('token') || '';
      const socket: WebSocketSubject<any> = new WebSocketSubject({
        url: finalWSUrl,
        protocol: [token, nodeIndex],
        closeObserver: { next: () => this.reopenWithNewToken(socket, token) }
      });
      this.socket = socket;
      this.subscribeToMessages();
    }
  }

  reconnectOnError() {
    if (this.RECONNECT_TIMEOUT || (this.socket && !this.socket.closed)) { return; }
    this.RETRY_SECONDS = (this.RETRY_SECONDS >= 160) ? 160 : (this.RETRY_SECONDS * 2);
    this.RECONNECT_TIMEOUT = setTimeout(() => {
      this.logger.info('Reconnecting Web Socket.');
      this.connectWebSocket(this.wsUrl, this.nodeIndex);
      this.RECONNECT_TIMEOUT = null;
    }, this.RETRY_SECONDS * 1000);
  }

  // A password change, in this tab or another of the browser, ends the token the socket opened
  // with and the server closes it. Reopen it with the token handed to this tab, whenever that
  // arrives; a closed socket holds up no request, so it can wait.
  private reopenWithNewToken(socket: WebSocketSubject<any>, token: string) {
    if (this.socket !== socket) { return; }
    this.sessionService.nextToken(token).pipe(take(1)).subscribe((newToken) => {
      if (newToken && this.socket === socket) {
        this.socket = null;
        this.connectWebSocket(this.wsUrl, this.nodeIndex);
      }
    });
  }

  closeConnection() {
    if (this.socket) {
      this.socket.complete();
      this.socket = null;
    }
  }

  private subscribeToMessages() {
    this.socket?.pipe(takeUntil(this.unSubs[1])).subscribe({
      next: (msg) => {
        msg = (typeof msg === 'string') ? JSON.parse(msg) : msg;
        if (msg.error) {
          this.handleError(msg.error);
        } else {
          this.logger.info('Next Message from WS:' + JSON.stringify(msg));
          switch (msg.source) {
            case 'LND':
              this.lndWSMessages.next(msg);
              break;
            case 'CLN':
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
    this.lndWSMessages.error(err);
    this.reconnectOnError();
  }

  ngOnDestroy() {
    this.closeConnection();
    this.clWSMessages.next(null);
    this.clWSMessages.complete();
    this.eclWSMessages.next(null);
    this.eclWSMessages.complete();
    this.lndWSMessages.next(null);
    this.lndWSMessages.complete();
  }

}

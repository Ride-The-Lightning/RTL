import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';

import { LoggerService } from '../../shared/services/logger.service';
import { SessionService } from './session.service';

@Injectable()
export class WebSocketClientService implements OnDestroy {

  public wsMessage: BehaviorSubject<any> = new BehaviorSubject(null);
  private wsUrl = '';
  private socket: WebSocketSubject<any> | null;
  private RETRY_SECONDS = 5;
  private RECONNECT_TIMEOUT = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private sessionService: SessionService) {}

  connectWebSocket(finalWSUrl: string) {
    this.wsUrl = finalWSUrl;
    this.logger.info('Websocket Url: ' + this.wsUrl);
    if (!this.socket || this.socket.closed) {
      this.socket = new WebSocketSubject({
        url: finalWSUrl,
        protocol: [this.sessionService.getItem('token')]
      });
      this.subscribeToMessages();
    }
  }

  reconnectOnError() {
    if (this.RECONNECT_TIMEOUT) { return; }
    this.RETRY_SECONDS = (this.RETRY_SECONDS >= 160) ? 160 : (this.RETRY_SECONDS * 2);
    this.RECONNECT_TIMEOUT = setTimeout(() => {
      this.logger.info('Reconnecting Web Socket.');
      this.connectWebSocket(this.wsUrl);
      this.RECONNECT_TIMEOUT = null;
    }, this.RETRY_SECONDS * 1000);
  }

  closeConnection() {
    if (this.socket) {
      this.socket.complete();
      this.socket = null;
    }
  }

  sendMessage(msg: any) {
    if (this.socket) {
      const payload = { token: 'token_from_session_service', message: msg };
      this.socket.next(payload);
    }
  }

  private subscribeToMessages() {
    this.socket.pipe(takeUntil(this.unSubs[1])).subscribe({
      next: (msg) => {
        if (typeof msg === 'string') { msg = JSON.parse(msg); }
        if (msg.error) {
          this.handleError(msg.error);
        } else {
          this.wsMessage.next(msg);
        }
      },
      error: (err) => this.handleError(err),
      complete: () => { this.logger.info('Web Socket Closed'); }
    });
  }

  private handleError(err) {
    this.logger.error(err);
    this.wsMessage.error(err);
    this.reconnectOnError();
  }

  ngOnDestroy() {
    this.closeConnection();
    this.wsMessage.next(null);
    this.wsMessage.complete();
  }

}

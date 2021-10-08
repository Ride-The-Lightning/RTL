import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';

import { LoggerService } from '../../shared/services/logger.service';

@Injectable()
export class WSService implements OnDestroy {

  public wsMessage: BehaviorSubject<any> = new BehaviorSubject(null);
  private wsUrl = '';
  private socket: WebSocketSubject<any> | null;
  private RETRY_SECONDS = 5;
  private RECONNECT_TIMEOUT = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService) {}

  connectWebSocket(finalWSUrl: string) {
    this.wsUrl = finalWSUrl;
    this.logger.info('Websocket Url: ' + this.wsUrl);
    if (!this.socket || this.socket.closed) {
      this.socket = new WebSocketSubject(finalWSUrl);
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

  private subscribeToMessages() {
    this.socket.pipe(takeUntil(this.unSubs[1])).subscribe({
      next: (msg) => { this.wsMessage.next(msg); },
      error: (err) => {
        this.logger.error(err);
        this.wsMessage.error(err);
        this.reconnectOnError();
      }
    });
  }

  ngOnDestroy() {
    this.closeConnection();
    this.wsMessage.next(null);
    this.wsMessage.complete();
  }

}

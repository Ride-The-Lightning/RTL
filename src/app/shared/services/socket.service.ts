import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import * as socketIo from 'socket.io-client';

export interface Socket {
  on(event: string, callback: (data: any) => void);
  emit(event: string, data: any);
}

@Injectable()
export class SocketService {
  socket: Socket;
  loopMonitor: any;
  observer: Observer<any>;

  startLoopMonitor(): Observable<any> {
    this.loopMonitor = socketIo('http://localhost:3000/loopMonitor');
    // this.loopMonitor = socketIo('/loopMonitor');
    this.loopMonitor.emit('start');
    this.loopMonitor.on('message', (res) => { this.observer.next(res.message); });
    return this.createObservable();
  }

  createObservable(): Observable<any> {
    return new Observable<any>(observer => { this.observer = observer; });
  }

  stopLoopMonitor() {
    this.loopMonitor.emit('end');
    this.loopMonitor = null;
  }

}

import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class SessionService {

  private sessionSub = new Subject<any>();

  watchSession(): Observable<any> {
    return this.sessionSub.asObservable();
  }

  getItem(key) {
    return sessionStorage.getItem(key);
  }

  getAllItems() {
    return sessionStorage;
  }

  setItem(key: string, data: any) {
    sessionStorage.setItem(key, data);
    this.sessionSub.next(sessionStorage);
  }

  removeItem(key) {
    sessionStorage.removeItem(key);
    this.sessionSub.next(sessionStorage);
  }

  clearAll() {
    sessionStorage.clear();
    this.sessionSub.next(sessionStorage);
  }

}

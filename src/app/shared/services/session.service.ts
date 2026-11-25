import { Injectable, OnDestroy } from '@angular/core';
import { Subject, Observable, of } from 'rxjs';
import { filter, map, take, timeout } from 'rxjs/operators';

// How long a tab waits for the token another tab hands it before it gives up on it.
export const TOKEN_HANDOFF_WAIT_MS = 1000;

@Injectable()
export class SessionService implements OnDestroy {

  private sessionSub = new Subject<any>();
  // The tabs of a browser share its session cookie, but each keeps its own token. A password
  // change ends every earlier token, so the tab that made it hands the new one to the others.
  // The channel is per base path, as each RTL behind one origin has its own session.
  private tokenChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('rtl-session-token:' + new URL(document.baseURI).pathname) : null;

  constructor() {
    if (this.tokenChannel) {
      this.tokenChannel.onmessage = (event) => {
        // Only a logged-in tab takes it; a logged-out one has a login of its own to do.
        if (typeof event.data === 'string' && event.data !== '' && this.getItem('token')) { this.setItem('token', event.data); }
      };
    }
  }

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

  shareToken(token: string) {
    if (this.tokenChannel) { this.tokenChannel.postMessage(token); }
  }

  // The tab's token if it is no longer the given one, waiting briefly for one to be handed over;
  // null if none arrives.
  tokenReplacing(previousToken: string): Observable<string | null> {
    const replacement = () => {
      const current = this.getItem('token');
      return (current && current !== previousToken) ? current : null;
    };
    if (replacement()) { return of(replacement()); }
    return this.watchSession().pipe(
      map(() => replacement()),
      filter((newToken) => !!newToken),
      take(1),
      timeout({ first: TOKEN_HANDOFF_WAIT_MS, with: () => of(null) }));
  }

  ngOnDestroy() {
    if (this.tokenChannel) { this.tokenChannel.close(); }
  }

}

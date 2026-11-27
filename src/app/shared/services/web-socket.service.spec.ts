import { fakeAsync, tick } from '@angular/core/testing';

import { WebSocketClientService } from './web-socket.service';
import { SessionService } from './session.service';
import { mockLoggerService } from '../test-helpers/mock-services';

// Stands in for the browser's WebSocket, which WebSocketSubject looks up when a socket is created.
class FakeWebSocket {

  static opened: FakeWebSocket[] = [];
  readyState = 0;
  binaryType = '';
  onopen: any = null;
  onclose: any = null;
  onerror: any = null;
  onmessage: any = null;

  constructor(public url: string, public protocol: string[]) {
    FakeWebSocket.opened.push(this);
  }

  open() {
    this.readyState = 1;
    if (this.onopen) { this.onopen({}); }
  }

  serverClose(code: number) {
    this.readyState = 3;
    if (this.onclose) { this.onclose({ code: code, wasClean: true, reason: '' }); }
  }

  close(code?: number) {
    this.serverClose(code || 1000);
  }

  send() { }

}

describe('WebSocketClientService', () => {
  const realWebSocket = window.WebSocket;
  let sessionService: SessionService;
  let service: WebSocketClientService;

  beforeEach(() => {
    sessionStorage.clear();
    FakeWebSocket.opened = [];
    (window as any).WebSocket = FakeWebSocket;
    sessionService = new SessionService();
    sessionService.setItem('token', 'old-token');
    service = new WebSocketClientService(new mockLoggerService() as any, sessionService);
    service.connectWebSocket('ws://localhost/rtl/api/ws', '1');
    FakeWebSocket.opened[0].open();
  });

  afterEach(() => {
    (window as any).WebSocket = realWebSocket;
    sessionService.ngOnDestroy();
    sessionStorage.clear();
  });

  it('opens the socket with the tab\'s token', () => {
    expect(FakeWebSocket.opened.length).toBe(1);
    expect(FakeWebSocket.opened[0].protocol).toEqual(['old-token', '1']);
  });

  it('reopens a socket the server closed, with the token handed to the tab since', fakeAsync(() => {
    FakeWebSocket.opened[0].serverClose(1008);
    tick(300);
    sessionService.setItem('token', 'new-token');
    tick();
    expect(FakeWebSocket.opened.length).toBe(2);
    expect(FakeWebSocket.opened[1].protocol).toEqual(['new-token', '1']);
  }));

  it('reopens a socket the server closed when the new token arrives late', fakeAsync(() => {
    FakeWebSocket.opened[0].serverClose(1008);
    tick(5000);
    sessionService.setItem('token', 'new-token');
    tick();
    expect(FakeWebSocket.opened.length).toBe(2);
    expect(FakeWebSocket.opened[1].protocol).toEqual(['new-token', '1']);
  }));

  it('does not reopen a socket the server closed once the tab has logged out', fakeAsync(() => {
    FakeWebSocket.opened[0].serverClose(1008);
    sessionService.clearAll();
    sessionService.setItem('token', 'next-login-token');
    tick();
    expect(FakeWebSocket.opened.length).toBe(1);
  }));

  it('reopens a socket the server closed for the node selected since it opened', fakeAsync(() => {
    service.connectWebSocket('ws://localhost/rtl/api/ws', '2');
    FakeWebSocket.opened[0].serverClose(1008);
    sessionService.setItem('token', 'new-token');
    tick();
    expect(FakeWebSocket.opened.length).toBe(2);
    expect(FakeWebSocket.opened[1].protocol).toEqual(['new-token', '2']);
  }));

  it('does not reopen a socket the server closed when no new token arrives', fakeAsync(() => {
    FakeWebSocket.opened[0].serverClose(1008);
    tick(1000);
    expect(FakeWebSocket.opened.length).toBe(1);
  }));

  it('does not reopen a socket the tab closed itself', fakeAsync(() => {
    service.closeConnection();
    sessionService.setItem('token', 'new-token');
    tick(1000);
    expect(FakeWebSocket.opened.length).toBe(1);
  }));
});

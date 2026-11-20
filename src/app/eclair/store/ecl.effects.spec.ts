import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReplaySubject } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';

import { SharedModule } from '../../shared/shared.module';
import { mockRTLStoreState } from '../../shared/test-helpers/test-data';
import { mockDataService, mockLoggerService, mockSessionService } from '../../shared/test-helpers/mock-services';
import { CommonService } from '../../shared/services/common.service';
import { SessionService } from '../../shared/services/session.service';
import { LoggerService } from '../../shared/services/logger.service';
import { DataService } from '../../shared/services/data.service';
import { WebSocketClientService } from '../../shared/services/web-socket.service';

import { ECLEffects } from './ecl.effects';
import { disconnectPeer, getQueryRoutes, invoiceLookup, peerLookup, saveNewPeer } from './ecl.actions';
import { allAPIsCallStatus } from './ecl.selector';
import { initECLState } from './ecl.state';

// A value that goes into a request URL is one path segment or one query value of it, whatever it contains.
describe('ECL Effects: values in a request URL', () => {
  let actions: ReplaySubject<any>;
  let effects: ECLEffects;
  let httpTestingController: HttpTestingController;
  const value = 'ab/../cd?e=f&g=h#i';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        ECLEffects, CommonService, HttpClient, WebSocketClientService,
        { provide: SessionService, useClass: mockSessionService },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        provideMockStore({ initialState: mockRTLStoreState, selectors: [{ selector: allAPIsCallStatus, value: initECLState.apisCallStatus }] }),
        provideMockActions(() => actions)
      ]
    });
    effects = TestBed.inject(ECLEffects);
    httpTestingController = TestBed.inject(HttpTestingController);
    actions = new ReplaySubject(1);
  });

  // The URL the browser requests once the effect has run, relative URLs resolved as it resolves them.
  const requestedUrl = (action, effect: string) => {
    actions.next(action);
    const sub = effects[effect].subscribe();
    const req = httpTestingController.expectOne(() => true);
    req.flush([]);
    sub.unsubscribe();
    return new URL(req.request.urlWithParams, 'http://localhost:3000/rtl/');
  };

  it('requests the nodes route with the looked up node id as its last segment', () => {
    expect(requestedUrl(peerLookup({ payload: value }), 'peerLookup').pathname).toBe('/rtl/api/ecl/network/nodes/' + encodeURIComponent(value));
  });

  it('requests the invoice route with the looked up payment hash as its last segment', () => {
    expect(requestedUrl(invoiceLookup({ payload: value }), 'invoiceLookup').pathname).toBe('/rtl/api/ecl/invoices/' + encodeURIComponent(value));
  });

  it('requests the peer route with the disconnected node id as its last segment', () => {
    expect(requestedUrl(disconnectPeer({ payload: { nodeId: value } }), 'detachPeer').pathname).toBe('/rtl/api/ecl/peers/' + encodeURIComponent(value));
  });

  it('sends the node id or URI of a new peer as one query value', () => {
    const byNodeId = requestedUrl(saveNewPeer({ payload: { id: value } }), 'saveNewPeer');
    expect(byNodeId.pathname).toBe('/rtl/api/ecl/peers');
    expect(Array.from(byNodeId.searchParams.entries())).toEqual([['nodeId', value]]);
    const byUri = requestedUrl(saveNewPeer({ payload: { id: value + '@host:9735' } }), 'saveNewPeer');
    expect(Array.from(byUri.searchParams.entries())).toEqual([['uri', value + '@host:9735']]);
  });

  it('sends the destination of a route query as one query value', () => {
    const url = requestedUrl(getQueryRoutes({ payload: { nodeId: value, amount: 1000 } }), 'queryRoutesFetch');
    expect(Array.from(url.searchParams.entries())).toEqual([['nodeId', value], ['amountMsat', '1000']]);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });
});

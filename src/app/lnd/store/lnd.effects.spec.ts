import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReplaySubject } from 'rxjs';
import { Store } from '@ngrx/store';
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
import { UI_MESSAGES } from '../../shared/services/consts-enums-functions';

import { LNDEffects } from './lnd.effects';
import { backupChannels, channelLookup, closeChannel, detachPeer, fetchGraphNode, getQueryRoutes, initWallet, invoiceLookup, paymentLookup, peerLookup, restoreChannels, sendPayment, verifyChannel } from './lnd.actions';
import { allAPIsCallStatus } from './lnd.selector';
import { initLNDState } from './lnd.state';

describe('LND Effects: sendPayment', () => {
  let actions: ReplaySubject<any>;
  let effects: LNDEffects;
  let dispatchSpy: jasmine.Spy;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        LNDEffects, CommonService, HttpClient, WebSocketClientService,
        { provide: SessionService, useClass: mockSessionService },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        provideMockStore({ initialState: mockRTLStoreState, selectors: [{ selector: allAPIsCallStatus, value: initLNDState.apisCallStatus }] }),
        provideMockActions(() => actions)
      ]
    });
    effects = TestBed.inject(LNDEffects);
    dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch');
    httpTestingController = TestBed.inject(HttpTestingController);
    actions = new ReplaySubject(1);
  });

  // Send one payment and fail it the way the server reports a no-route failure under a fee limit.
  const failWithNoRoute = (fromDialog: boolean, done: DoneFn, check: (dispatched: any[]) => void) => {
    actions.next(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, payment_request: 'lnbcrt100u1test', amp: false, fee_limit_sat: 500, fee_limit_type: 'default', fromDialog } }));
    const sub = effects.sendPayment.subscribe(() => {
      check(dispatchSpy.calls.allArgs().map(([action]) => action));
      done();
      setTimeout(() => sub.unsubscribe());
    });
    const req = httpTestingController.expectOne((request) => request.url.endsWith('/payments/send'));
    expect(req.request.body.fee_limit_type).toBeUndefined();
    expect(req.request.body.fee_limit_sat).toBe(500);
    req.flush({ message: 'Send Payment Error', error: 'No Route ', cheapest_route_fee_sat: 500000 }, { status: 500, statusText: 'Internal Server Error' });
  };

  it('should tell the Send Payment dialog what the cheapest route costs', (done) => {
    failWithNoRoute(true, done, (dispatched) => {
      const status = dispatched.find((action) => action.payload?.action === 'SendPayment' && action.payload?.status === 'ERROR');
      expect(status.payload.message).toBe('Payment not sent. Nothing was paid. The cheapest route LND found costs 500,000 Sats in fees, more than the default max fee of 500 Sats. ' +
        'If you\'re willing to pay that fee, raise the limit in Advanced Options and send again.');
    });
  });

  it('should tell Home > Pay what the cheapest route costs, and where to raise the limit', (done) => {
    failWithNoRoute(false, done, (dispatched) => {
      const alert = dispatched.find((action) => action.payload?.data?.alertTitle === 'Send Payment Failed');
      expect(alert.payload.data.message.message).toBe('Payment not sent. Nothing was paid. The cheapest route LND found costs 500,000 Sats in fees, more than the default max fee of 500 Sats. ' +
        'If you\'re willing to pay that fee, use Send Payment under Transactions > Payments and set a higher limit in Advanced Options.');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });
});

// Issue #494: the recovery window has to reach the server for LND to rescan a restored wallet.
describe('LND Effects: initWallet', () => {
  let actions: ReplaySubject<any>;
  let effects: LNDEffects;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        LNDEffects, CommonService, HttpClient, WebSocketClientService,
        { provide: SessionService, useClass: mockSessionService },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        provideMockStore({ initialState: mockRTLStoreState, selectors: [{ selector: allAPIsCallStatus, value: initLNDState.apisCallStatus }] }),
        provideMockActions(() => actions)
      ]
    });
    effects = TestBed.inject(LNDEffects);
    httpTestingController = TestBed.inject(HttpTestingController);
    actions = new ReplaySubject(1);
  });

  const sentBody = (payload) => {
    actions.next(initWallet({ payload }));
    const sub = effects.initWallet.subscribe();
    const req = httpTestingController.expectOne((request) => request.url.endsWith('/wallet/initwallet'));
    req.flush('Successful');
    sub.unsubscribe();
    return req.request.body;
  };

  it('posts the recovery window of a restored wallet', () => {
    expect(sentBody({ pwd: 'cHdk', cipher: ['one', 'two'], recoveryWindow: 2500 })).
      toEqual({ wallet_password: 'cHdk', cipher_seed_mnemonic: ['one', 'two'], aezeed_passphrase: '', recovery_window: 2500 });
    expect(sentBody({ pwd: 'cHdk', cipher: ['one', 'two'], recoveryWindow: 0 }).recovery_window).toBe(0);
  });

  it('posts no recovery window for a newly generated seed', () => {
    expect(sentBody({ pwd: 'cHdk', cipher: ['one', 'two'] })).
      toEqual({ wallet_password: 'cHdk', cipher_seed_mnemonic: ['one', 'two'], aezeed_passphrase: '' });
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });
});

// A value that goes into the path of a request URL is one segment of it, whatever it contains.
describe('LND Effects: values in a request path', () => {
  let actions: ReplaySubject<any>;
  let effects: LNDEffects;
  let httpTestingController: HttpTestingController;
  const value = 'ab/../cd?e=f#g';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, SharedModule, RouterTestingModule, HttpClientTestingModule],
      providers: [
        LNDEffects, CommonService, HttpClient, WebSocketClientService,
        { provide: SessionService, useClass: mockSessionService },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        provideMockStore({ initialState: mockRTLStoreState, selectors: [{ selector: allAPIsCallStatus, value: initLNDState.apisCallStatus }] }),
        provideMockActions(() => actions)
      ]
    });
    effects = TestBed.inject(LNDEffects);
    httpTestingController = TestBed.inject(HttpTestingController);
    actions = new ReplaySubject(1);
  });

  // The URL the browser requests once the effect has run, relative URLs resolved as it resolves them.
  const requestedUrl = (action, effect: string) => {
    actions.next(action);
    const sub = effects[effect].subscribe();
    const req = httpTestingController.expectOne(() => true);
    req.flush({});
    sub.unsubscribe();
    return new URL(req.request.urlWithParams, 'http://localhost:3000/rtl/');
  };
  const requestedPath = (action, effect: string) => requestedUrl(action, effect).pathname;

  it('requests the node route with the looked up pubkey as its last segment', () => {
    expect(requestedPath(peerLookup({ payload: value }), 'peerLookup')).toBe('/rtl/api/lnd/network/node/' + encodeURIComponent(value));
    expect(requestedPath(fetchGraphNode({ payload: { pubkey: value } }), 'graphNodeFetch')).toBe('/rtl/api/lnd/network/node/' + encodeURIComponent(value));
  });

  it('requests the edge route with the looked up channel id as its last segment', () => {
    expect(requestedPath(channelLookup({ payload: { uiMessage: UI_MESSAGES.SEARCHING_CHANNEL, channelID: value } }), 'channelLookup')).
      toBe('/rtl/api/lnd/network/edge/' + encodeURIComponent(value));
  });

  it('requests the payment lookup route with the payment hash as its last segment', () => {
    expect(requestedPath(paymentLookup({ payload: value }), 'paymentLookup')).toBe('/rtl/api/lnd/payments/lookup/' + encodeURIComponent(value));
  });

  it('sends the payment hash or address of an invoice lookup as one query value', () => {
    const byHash = requestedUrl(invoiceLookup({ payload: { openSnackBar: false, paymentHash: 'ab&cd=ef#g==' } }), 'invoiceLookup');
    expect(byHash.pathname).toBe('/rtl/api/lnd/invoices/lookup');
    expect(Array.from(byHash.searchParams.entries())).toEqual([['payment_hash', 'ab&cd=ef#g==']]);
    const byAddress = requestedUrl(invoiceLookup({ payload: { openSnackBar: false, paymentAddress: 'ab&cd=ef#g==' } }), 'invoiceLookup');
    expect(Array.from(byAddress.searchParams.entries())).toEqual([['payment_addr', 'ab&cd=ef#g==']]);
  });

  it('requests the routes route with the destination pubkey and the amount as its last two segments', () => {
    expect(requestedPath(getQueryRoutes({ payload: { destPubkey: value, amount: 1000 } }), 'queryRoutesFetch')).
      toBe('/rtl/api/lnd/network/routes/' + encodeURIComponent(value) + '/1000');
  });

  it('requests the channel route with the closed channel point as its last segment, and its options as query values', () => {
    const url = requestedUrl(closeChannel({ payload: { channelPoint: value, forcibly: false, targetConf: 6 } }), 'closeChannel');
    expect(url.pathname).toBe('/rtl/api/lnd/channels/' + encodeURIComponent(value));
    expect(Array.from(url.searchParams.entries())).toEqual([['force', 'false'], ['target_conf', '6']]);
    const withFee = requestedUrl(closeChannel({ payload: { channelPoint: value, forcibly: false, satPerVByte: 12 } }), 'closeChannel');
    expect(Array.from(withFee.searchParams.entries())).toEqual([['force', 'false'], ['sat_per_vbyte', '12']]);
  });

  it('requests the peer route with the detached pubkey as its last segment', () => {
    expect(requestedPath(detachPeer({ payload: { pubkey: value } }), 'detachPeer')).toBe('/rtl/api/lnd/peers/' + encodeURIComponent(value));
  });

  it('requests the channel backup routes with the channel point as their last segment', () => {
    expect(requestedPath(backupChannels({ payload: { uiMessage: UI_MESSAGES.NO_SPINNER, channelPoint: value, showMessage: '' } }), 'backupChannels')).
      toBe('/rtl/api/lnd/channels/backup/' + encodeURIComponent(value));
    expect(requestedPath(verifyChannel({ payload: { channelPoint: value } }), 'verifyChannel')).toBe('/rtl/api/lnd/channels/backup/verify/' + encodeURIComponent(value));
    expect(requestedPath(restoreChannels({ payload: { channelPoint: value } }), 'restoreChannels')).toBe('/rtl/api/lnd/channels/backup/restore/' + encodeURIComponent(value));
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });
});

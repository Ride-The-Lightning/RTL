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
import { sendPayment } from './lnd.actions';
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

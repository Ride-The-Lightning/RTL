import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';
import { SharedModule } from '../../../shared/shared.module';
import { APICallStatusEnum, CLNActions, PaymentTypes } from '../../../shared/services/consts-enums-functions';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockLoggerService, mockMatDialogRef, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { setOfferInvoice, updateCLNAPICallStatus } from '../../store/cln.actions';

import { CLNLightningSendPaymentsComponent } from './send-payment.component';

describe('CLNLightningSendPaymentsComponent offer payments', () => {
  let component: CLNLightningSendPaymentsComponent;
  let fixture: ComponentFixture<CLNLightningSendPaymentsComponent>;
  let store: Store;
  let dispatchSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNLightningSendPaymentsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNLightningSendPaymentsComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    fixture.detectChanges();
  });

  const dispatched = (type: string) => dispatchSpy.calls.allArgs().map((args) => args[0]).filter((action) => action.type === type);

  // The state the form is in once an offer has been decoded and the amount is on screen
  // (the dialog shows sats, so offerAmount is msat / 1000 exactly as setOfferDecodedDetails sets it).
  const decodedOffer = (amountMsat: number, zeroAmount: boolean) => {
    component.paymentType = PaymentTypes.OFFER;
    component.offerRequest = 'lno1testoffer';
    component.offerDecoded = { offer_id: 'test-offer-id', offer_amount_msat: zeroAmount ? 0 : amountMsat };
    component.zeroAmtOffer = zeroAmount;
    component.offerAmount = amountMsat / 1000;
  };

  // The reply the fetch effect dispatches for the n-th fetch this dialog made: it carries that request.
  const replyTo = (fetchIndex: number, invoice: string, changes = {}) => {
    const request = dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN)[fetchIndex].payload;
    return setOfferInvoice({ payload: { invoice: invoice, changes: changes, request: request } });
  };

  it('does not pay when the issuer returns an invoice for a different amount', () => {
    decodedOffer(1000000, false);
    component.onSendPayment();
    expect(dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN).length).toBe(1);

    store.dispatch(replyTo(0, 'lni1issuerinvoice', { amount_msat: 5000000 }));

    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);
    expect(component.offerInvoice).toBeNull();
    expect(component.paymentError).toContain('5,000 Sats instead of 1,000 Sats');
  });

  it('pays the fetched invoice when the issuer keeps the form amount', () => {
    decodedOffer(1000000, false);
    component.onSendPayment();

    store.dispatch(replyTo(0, 'lni1issuerinvoice'));

    const sent = dispatched(CLNActions.SEND_PAYMENT_CLN);
    expect(sent.length).toBe(1);
    expect(sent[0].payload.bolt11).toBe('lni1issuerinvoice');
    expect(sent[0].payload.amount_msat).toBe(1000000);
    expect(component.paymentError).toBe('');
  });

  it('fetches a new invoice after the amount of a zero-amount offer is edited', () => {
    decodedOffer(1000000, true);
    component.onSendPayment();
    store.dispatch(replyTo(0, 'lni1oldamount'));
    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(1);

    // The payment failed; the user edits the amount and sends again.
    component.offerAmount = 2000;
    component.onAmountChange({ target: { value: '2000' } });
    component.onSendPayment();

    const fetches = dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN);
    expect(fetches.length).toBe(2);
    expect(fetches[1].payload.amount_msat).toBe(2000000);
    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(1);
  });

  it('pays an offer priced in a fraction of a sat for exactly its msat amount', () => {
    decodedOffer(1001, false);
    component.onSendPayment();

    store.dispatch(replyTo(0, 'lni1issuerinvoice', { amount_msat: 1001 }));

    const sent = dispatched(CLNActions.SEND_PAYMENT_CLN);
    expect(sent.length).toBe(1);
    expect(sent[0].payload.amount_msat).toBe(1001);
    expect(component.paymentError).toBe('');
  });

  it('drops an invoice that arrives after the amount was edited', () => {
    decodedOffer(2000000, true);
    component.onSendPayment();
    expect(dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN)[0].payload.amount_msat).toBe(2000000);

    // The amount is edited while the invoice for 2,000 sats is still being fetched.
    component.offerAmount = 3000;
    component.onAmountChange({ target: { value: '3000' } });
    store.dispatch(replyTo(0, 'lni1for2000'));

    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);
    expect(component.offerInvoice).toBeNull();
    expect(component.paymentError).not.toBe('');
  });

  it('does not start a second fetch while one is pending, so a late reply cannot be sent for a newer amount', () => {
    decodedOffer(2000000, true);
    component.onSendPayment();

    // The amount is edited and Send clicked again before the first reply arrives.
    component.offerAmount = 3000;
    component.onAmountChange({ target: { value: '3000' } });
    component.onSendPayment();
    expect(dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN).length).toBe(1);

    // The reply to the first fetch (2,000 sats) is dropped.
    store.dispatch(replyTo(0, 'lni1for2000'));
    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);

    // Sending again fetches and pays for the current amount.
    component.onSendPayment();
    const fetches = dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN);
    expect(fetches.length).toBe(2);
    expect(fetches[1].payload.amount_msat).toBe(3000000);
    store.dispatch(replyTo(1, 'lni1for3000'));
    const sent = dispatched(CLNActions.SEND_PAYMENT_CLN);
    expect(sent.length).toBe(1);
    expect(sent[0].payload.bolt11).toBe('lni1for3000');
    expect(sent[0].payload.amount_msat).toBe(3000000);
  });

  it('drops an invoice that arrives after a different offer was entered', () => {
    decodedOffer(1000000, false);
    component.onSendPayment();

    // A different offer for the same amount is entered while the first invoice is being fetched.
    component.onPaymentRequestEntry('lno1otheroffer');
    decodedOffer(1000000, false);
    component.offerRequest = 'lno1otheroffer';
    store.dispatch(replyTo(0, 'lni1forfirstoffer'));

    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);
    expect(component.offerInvoice).toBeNull();
  });

  it('does not pay the Invoice tab when an offer reply arrives after switching to it', () => {
    decodedOffer(1000000, false);
    component.onSendPayment();

    component.paymentType = PaymentTypes.INVOICE;
    component.onPaymentTypeChange();
    component.paymentRequest = 'lnbcrt1unconfirmedinvoice';
    store.dispatch(replyTo(0, 'lni1issuerinvoice'));

    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);
    expect(component.offerInvoice).toBeNull();
  });

  it('allows a new fetch after a fetch failed while another tab was showing', () => {
    decodedOffer(1000000, false);
    component.onSendPayment();

    component.paymentType = PaymentTypes.INVOICE;
    component.onPaymentTypeChange();
    store.dispatch(updateCLNAPICallStatus({ payload: { action: 'FetchOfferInvoice', status: APICallStatusEnum.ERROR, message: 'Offer Invoice Fetch Failed' } }));
    component.paymentType = PaymentTypes.OFFER;
    component.onPaymentTypeChange();

    component.onSendPayment();
    expect(dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN).length).toBe(2);
  });

  it('tells the user to wait when Send is clicked while the invoice is still being fetched', () => {
    decodedOffer(1000000, false);
    component.onSendPayment();
    component.onSendPayment();

    expect(dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN).length).toBe(1);
    expect(component.paymentError).toBe('Fetching the offer invoice, please wait.');
  });

  it('pays the reply to its own fetch, not a late reply fetched for another offer', () => {
    decodedOffer(1000000, false);
    component.onSendPayment();

    // A late reply to a fetch from a closed dialog, for a different offer with the same amount.
    store.dispatch(setOfferInvoice({ payload: { invoice: 'lni1otheroffer', changes: {}, request: { offer: 'lno1otheroffer' } } }));
    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);

    store.dispatch(replyTo(0, 'lni1thisfetch'));
    store.dispatch(replyTo(0, 'lni1thisfetchagain'));
    const sent = dispatched(CLNActions.SEND_PAYMENT_CLN);
    expect(sent.length).toBe(1);
    expect(sent[0].payload.bolt11).toBe('lni1thisfetch');
  });

  it('ignores a late reply for the same offer fetched at a different amount', () => {
    decodedOffer(3000000, true);
    component.onSendPayment();

    store.dispatch(setOfferInvoice({ payload: { invoice: 'lni1for2000', changes: {}, request: { offer: 'lno1testoffer', amount_msat: 2000000 } } }));
    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);

    store.dispatch(replyTo(0, 'lni1for3000'));
    const sent = dispatched(CLNActions.SEND_PAYMENT_CLN);
    expect(sent.length).toBe(1);
    expect(sent[0].payload.bolt11).toBe('lni1for3000');
  });

  it('ignores an offer invoice it did not fetch', () => {
    decodedOffer(1000000, false);
    store.dispatch(setOfferInvoice({ payload: { invoice: 'lni1notrequested', changes: {} } }));

    expect(dispatched(CLNActions.SEND_PAYMENT_CLN).length).toBe(0);
    expect(component.offerInvoice).toBeNull();
    expect(component.paymentError).toBe('');
  });

  it('allows a new fetch after the previous one failed', () => {
    decodedOffer(2000000, true);
    component.onSendPayment();
    store.dispatch(updateCLNAPICallStatus({ payload: { action: 'FetchOfferInvoice', status: APICallStatusEnum.ERROR, message: 'Offer Invoice Fetch Failed' } }));

    component.onSendPayment();
    expect(dispatched(CLNActions.FETCH_OFFER_INVOICE_CLN).length).toBe(2);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

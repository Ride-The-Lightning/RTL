import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';

import { CommonService } from '../../../shared/services/common.service';
import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { LightningSendPaymentsComponent } from './send-payment.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { LoggerService } from '../../../shared/services/logger.service';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { EffectsModule } from '@ngrx/effects';
import { FEE_LIMIT_TYPES, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { mockRTLStoreState } from '../../../shared/test-helpers/test-data';

import { RTLState } from '../../../store/rtl.state';
import { sendPayment } from '../../store/lnd.actions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';

describe('LightningSendPaymentsComponent', () => {
  let component: LightningSendPaymentsComponent;
  let fixture: ComponentFixture<LightningSendPaymentsComponent>;
  let commonService: CommonService;
  let store: Store<RTLState>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LightningSendPaymentsComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: DataService, useClass: mockDataService },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightningSendPaymentsComponent);
    component = fixture.componentInstance;
    commonService = fixture.debugElement.injector.get(CommonService);
    store = fixture.debugElement.injector.get(Store);
    fixture.detectChanges();
  });

  it('should create', () => {
    const storeSpyChannels = spyOn(store, 'select').and.returnValue(of(mockRTLStoreState.lnd.channels));
    component.activeChannels = [];
    expect(component).toBeTruthy();
  });

  it('should get lnd store value on ngOnInit', () => {
    const storeSpy = spyOn(store, 'select').and.returnValue(of(mockRTLStoreState.lnd.nodeSettings));
    component.ngOnInit();
    expect(component.selNode.lnImplementation).toBe('LND');
    expect(storeSpy).toHaveBeenCalledTimes(2);
  });

  it('should send payment buttons work as expected', () => {
    const storeSpy = spyOn(store, 'dispatch').and.callThrough();
    component.zeroAmtInvoice = true;
    component.paymentAmount = 600;
    component.paymentRequest = 'lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3';
    component.paymentDecoded = {
      destination: '031844beb16bf8dd8c7bc30588b8c37b36e62b71c6e812e9b6d976c0a57e151be2', payment_hash: 'a53968453af7ab6fc58d229a91bdf23d7c121963067f06cf02e1a7b581852c07', timestamp: '1623624612', expiry: '3600',
      description: 'Testing ngrx Effects 4', description_hash: '', fallback_addr: '', cltv_expiry: '10', route_hints: [{ hop_hints: [{ node_id: '028ec70462207b57e3d4d9332d9e0aee676c92d89b7c9fb0850fc2a24814d4d83c', chan_id: '2166413939696009216', fee_base_msat: 1000, fee_proportional_millionths: 1, cltv_expiry_delta: 40 }] }],
      payment_addr: 'NIXNBEqCTmqw89joe0m71Z9MrkkBcF1t1ri+9BZehKw=', num_msat: '400000', features: { 9: { name: 'tlv-onion', is_required: false, is_known: true }, 15: { name: 'payment-addr', is_required: false, is_known: true }, 17: { name: 'multi-path-payments', is_required: false, is_known: true } }
    };
    const sendButton = fixture.debugElement.nativeElement.querySelector('#sendBtn');
    sendButton.click();
    const expectedSendPaymentPayload = {
      uiMessage: UI_MESSAGES.SEND_PAYMENT, outgoingChannel: null, feeLimitType: 'none', feeLimit: null, fromDialog: true,
      paymentReq: 'lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3'
    };
    expect(storeSpy.calls.all()[0].args[0]).toEqual(sendPayment({ payload: expectedSendPaymentPayload }));
    expect(storeSpy).toHaveBeenCalledTimes(1);
  });

  it('should reset the component', () => {
    component.resetData();
    expect(component.paymentDecoded).toEqual({});
    expect(component.paymentRequest).toEqual('');
    expect(component.selectedChannelCtrl.value).toBe(null);
    expect(component.filteredMinAmtActvChannels).toEqual(component.activeChannels);
    expect(component.feeLimit).toBe(null);
    expect(component.selFeeLimitType).toEqual(FEE_LIMIT_TYPES[0]);
    expect(component.advancedTitle).toEqual('Advanced Options');
    expect(component.zeroAmtInvoice).toEqual(false);
    expect(component.paymentReq.control.errors).toBe(null);
    expect(component.paymentError).toEqual('');
    expect(component.paymentDecodedHint).toEqual('');
  });

  it('should update title on advanced panel toggle', () => {
    component.onAdvancedPanelToggle(true, false);
    expect(component.advancedTitle).toContain('Advanced Options | ');
    component.onAdvancedPanelToggle(false, false);
    expect(component.advancedTitle).toContain('Advanced Options');
  });

  it('should clear the payment decoded amount on amount change', () => {
    component.paymentDecoded.num_satoshis = '400';
    component.onAmountChange({});
    expect(component.paymentDecoded.num_satoshis).toBeFalsy();
  });

  it('should return from decode payment when pay request length is less than hundred ', () => {
    component.onPaymentRequestEntry('lntb4u1psvdzaypp55');
    expect(component.paymentDecodedHint).toEqual('');
  });

  it('should decode payment when pay request is for the zero amount invoice', () => {
    component.zeroAmtInvoice = false;
    component.paymentDecoded = {};
    component.paymentRequest = 'lntb1ps8neg8pp5u897fhxxzg068jzt59tgqe458jt7srjtd6k93x4t9ts3hqdkd2nsdpj23jhxarfdenjq3tdwp68jgzfdemx76trv5sxvmmjypxyu3pqxvxqyd9uqcqp2sp5feg8wftf3fasmp2fe86kehyqfat2xcrjvunare7rrn28yjdrw8yqrzjq2m42d94jc8fxjzq675cmhr7fpjg0vr6238xutxp9p78yeaucwjfjxgpcuqqqxsqqyqqqqlgqqqqqqgq9q9qy9qsqwf6a4w9uqthm3aslwt03ucqt03e8j2atxrmt022d5kaw65cmqc3pnghz5xmsh2tlz9syhaulrxtwmvh3gdx9j33gec6yrycwh2g05qgqdnftgk';
    component.onPaymentRequestEntry(component.paymentRequest);
    fixture.detectChanges();
    expect(component.zeroAmtInvoice).toBe(true);
    expect(component.paymentDecodedHint).toEqual('Memo: Testing Empty Invoice for LND 3');
    expect(component.filteredMinAmtActvChannels).toEqual(component.activeChannels);
  });

  it('should NOT send payment when pay request is for zero amount invoice AND amount is not specified', () => {
    spyOn(component, 'sendPayment').and.callThrough();
    component.onPaymentRequestEntry('lntb1ps8neg8pp5u897fhxxzg068jzt59tgqe458jt7srjtd6k93x4t9ts3hqdkd2nsdpj23jhxarfdenjq3tdwp68jgzfdemx76trv5sxvmmjypxyu3pqxvxqyd9uqcqp2sp5feg8wftf3fasmp2fe86kehyqfat2xcrjvunare7rrn28yjdrw8yqrzjq2m42d94jc8fxjzq675cmhr7fpjg0vr6238xutxp9p78yeaucwjfjxgpcuqqqxsqqyqqqqlgqqqqqqgq9q9qy9qsqwf6a4w9uqthm3aslwt03ucqt03e8j2atxrmt022d5kaw65cmqc3pnghz5xmsh2tlz9syhaulrxtwmvh3gdx9j33gec6yrycwh2g05qgqdnftgk');
    expect(component.zeroAmtInvoice).toBe(true);
    expect(component.paymentDecodedHint).toEqual('Memo: Testing Empty Invoice for LND 3');
    expect(component.filteredMinAmtActvChannels).toEqual(component.activeChannels);
    expect(component.paymentAmount).toBeNull();
    component.onSendPayment();
    expect(component.sendPayment).not.toHaveBeenCalled();
    component.paymentAmount = 100;
    component.onSendPayment();
    expect(component.sendPayment).toHaveBeenCalled();
  });

  it('should decode payment when pay request changed and fiat conversion is true', () => {
    const updatedSelNode: SelNodeChild = JSON.parse(JSON.stringify(component.selNode));
    updatedSelNode.fiatConversion = true;
    updatedSelNode.currencyUnits[2] = 'USD';
    Object.defineProperty(component, 'selNode', { value: updatedSelNode });
    component.onPaymentRequestEntry('lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3');
    expect(component.paymentDecodedHint).toEqual('Sending: 400 Sats (USD 0.13) | Memo: Testing ngrx Effects 4');
  });

  it('should decode payment when pay request changed and fiat conversion is false', () => {
    component.onPaymentRequestEntry('lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3');
    expect(component.paymentDecodedHint).toEqual('Sending: 400 Sats | Memo: Testing ngrx Effects 4');
  });

  it('should throw an error from decode payment when pay request is not found', () => {
    component.onPaymentRequestEntry('p555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp3434dsfdsf');
    expect(component.paymentDecodedHint).toEqual('ERROR: Request Failed!');
  });

  it('should convert Sats to USD by calling convertCurrency method from CommonService', () => {
    commonService.convertCurrency(200000, 'Sats', 'OTHER', 'USD', true).subscribe((data) => {
      expect(data.OTHER).toBe(66.87764);
    });
  });

  it('should send the payment when the payment is decoded', () => {
    spyOn(component, 'sendPayment').and.callThrough();
    component.zeroAmtInvoice = true;
    component.paymentAmount = 600;
    component.paymentRequest = 'lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3';
    component.paymentDecoded = {
      destination: '031844beb16bf8dd8c7bc30588b8c37b36e62b71c6e812e9b6d976c0a57e151be2', payment_hash: 'a53968453af7ab6fc58d229a91bdf23d7c121963067f06cf02e1a7b581852c07', timestamp: '1623624612', expiry: '3600',
      description: 'Testing ngrx Effects 4', description_hash: '', fallback_addr: '', cltv_expiry: '10', route_hints: [{ hop_hints: [{ node_id: '028ec70462207b57e3d4d9332d9e0aee676c92d89b7c9fb0850fc2a24814d4d83c', chan_id: '2166413939696009216', fee_base_msat: 1000, fee_proportional_millionths: 1, cltv_expiry_delta: 40 }] }],
      payment_addr: 'NIXNBEqCTmqw89joe0m71Z9MrkkBcF1t1ri+9BZehKw=', num_msat: '400000', features: { 9: { name: 'tlv-onion', is_required: false, is_known: true }, 15: { name: 'payment-addr', is_required: false, is_known: true }, 17: { name: 'multi-path-payments', is_required: false, is_known: true } }
    };
    component.onSendPayment();
    expect(component.paymentDecoded.num_satoshis).toEqual('400');
    expect(component.zeroAmtInvoice).toBe(false);
    expect(component.sendPayment).toHaveBeenCalledTimes(1);
  });

  it('should decode the payment when send payment clicked but payment is not decoded yet', () => {
    const onPaymentRequestEntrySpy = spyOn(component, 'onPaymentRequestEntry').and.callThrough();
    component.zeroAmtInvoice = true;
    component.paymentAmount = 600;
    component.paymentRequest = 'lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3';
    component.paymentDecoded = {};
    component.onSendPayment();
    expect(component.paymentDecoded.num_satoshis).toEqual('400');
    expect(component.zeroAmtInvoice).toBe(false);
    expect(onPaymentRequestEntrySpy).toHaveBeenCalledTimes(1);
  });

  it('should decode the zero amount payment when send payment clicked but payment is not decoded yet', () => {
    const onPaymentRequestEntrySpy = spyOn(component, 'onPaymentRequestEntry').and.callThrough();
    component.zeroAmtInvoice = false;
    component.paymentRequest = 'lntb1ps8neg8pp5u897fhxxzg068jzt59tgqe458jt7srjtd6k93x4t9ts3hqdkd2nsdpj23jhxarfdenjq3tdwp68jgzfdemx76trv5sxvmmjypxyu3pqxvxqyd9uqcqp2sp5feg8wftf3fasmp2fe86kehyqfat2xcrjvunare7rrn28yjdrw8yqrzjq2m42d94jc8fxjzq675cmhr7fpjg0vr6238xutxp9p78yeaucwjfjxgpcuqqqxsqqyqqqqlgqqqqqqgq9q9qy9qsqwf6a4w9uqthm3aslwt03ucqt03e8j2atxrmt022d5kaw65cmqc3pnghz5xmsh2tlz9syhaulrxtwmvh3gdx9j33gec6yrycwh2g05qgqdnftgk';
    component.paymentDecoded = {};
    component.onSendPayment();
    fixture.detectChanges();
    expect(component.zeroAmtInvoice).toBe(true);
    expect(component.filteredMinAmtActvChannels).toEqual(component.activeChannels);
    expect(onPaymentRequestEntrySpy).toHaveBeenCalledTimes(1);
  });

  it('should complete subscriptions on ngOnDestroy', () => {
    const spy = spyOn(component['unSubs'][1], 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

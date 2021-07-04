import { waitForAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { LightningSendPaymentsComponent } from './send-payment.component';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockLoggerService, mockMatDialogRef, mockRTLEffects } from '../../../shared/test-helpers/test-consts';
import { LoggerService } from '../../../shared/services/logger.service';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { MatDialogRef } from '@angular/material/dialog';
import { EffectsModule } from '@ngrx/effects';
import { FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';

describe('LightningSendPaymentsComponent', () => {
  let component: LightningSendPaymentsComponent;
  let fixture: ComponentFixture<LightningSendPaymentsComponent>;
  let commonService: CommonService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LightningSendPaymentsComponent ],
      imports: [ 
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightningSendPaymentsComponent);
    component = fixture.componentInstance;
    commonService = fixture.debugElement.injector.get(CommonService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset the component', () => {
    component.resetData();
    expect(component.paymentDecoded).toEqual({});
    expect(component.paymentRequest).toEqual('');
    expect(component.selActiveChannel).toBe(null);
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
    component.onAdvancedPanelToggle(true);
    expect(component.advancedTitle).toContain('Advanced Options | ');
    component.onAdvancedPanelToggle(false);
    expect(component.advancedTitle).toContain('Advanced Options');
  });

  it('should clear the payment decoded amount on amount change', () => {
    component.paymentDecoded.num_satoshis = '400';
    component.onAmountChange({});
    expect(component.paymentDecoded.num_satoshis).toBeFalsy();
  });

  it('should decode payment when pay request changed', () => {
      component.onPaymentRequestEntry('lntb4u1psvdzaypp55');
      expect(component.paymentDecodedHint).toEqual('');

      component.onPaymentRequestEntry('lntb1ps8neg8pp5u897fhxxzg068jzt59tgqe458jt7srjtd6k93x4t9ts3hqdkd2nsdpj23jhxarfdenjq3tdwp68jgzfdemx76trv5sxvmmjypxyu3pqxvxqyd9uqcqp2sp5feg8wftf3fasmp2fe86kehyqfat2xcrjvunare7rrn28yjdrw8yqrzjq2m42d94jc8fxjzq675cmhr7fpjg0vr6238xutxp9p78yeaucwjfjxgpcuqqqxsqqyqqqqlgqqqqqqgq9q9qy9qsqwf6a4w9uqthm3aslwt03ucqt03e8j2atxrmt022d5kaw65cmqc3pnghz5xmsh2tlz9syhaulrxtwmvh3gdx9j33gec6yrycwh2g05qgqdnftgk');
      expect(component.zeroAmtInvoice).toBe(true);
      expect(component.paymentDecodedHint).toEqual('Memo: Testing Empty Invoice for LND 3');
      expect(component.filteredMinAmtActvChannels).toEqual(component.activeChannels);

      component.selNode.fiatConversion = true;
      component.selNode.currencyUnits[2] = 'INR';
      component.onPaymentRequestEntry('lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3');
      expect(component.paymentDecodedHint).toEqual('Sending: 400 Sats (INR10.75) | Memo: Testing ngrx Effects 4');

      component.selNode.fiatConversion = false;
      component.onPaymentRequestEntry('lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3');
      expect(component.paymentDecodedHint).toEqual('Sending: 400 Sats | Memo: Testing ngrx Effects 4');

      component.onPaymentRequestEntry('p555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp3434dsfdsf');
      expect(component.paymentDecodedHint).toEqual('ERROR: Request Failed!');
  });

  it('should convert Sats to USD by calling convertCurrency method from CommonService', () => {
    commonService.convertCurrency(200000, 'Sats', 'USD', true).subscribe(data => {
      expect(data.OTHER).toBe(66.87764);
    });
  });

  it('should send payment', () => {
    const spyOnSendPayment: jasmine.Spy = spyOn(component, 'sendPayment');
    component.paymentDecoded = {"destination":"031844beb16bf8dd8c7bc30588b8c37b36e62b71c6e812e9b6d976c0a57e151be2","payment_hash":"a53968453af7ab6fc58d229a91bdf23d7c121963067f06cf02e1a7b581852c07","num_satoshis":"400","timestamp":"1623624612","expiry":"3600","description":"Testing ngrx Effects 4","description_hash":"","fallback_addr":"","cltv_expiry":"10","route_hints":[{"hop_hints":[{"node_id":"028ec70462207b57e3d4d9332d9e0aee676c92d89b7c9fb0850fc2a24814d4d83c","chan_id":"2166413939696009216","fee_base_msat":1000,"fee_proportional_millionths":1,"cltv_expiry_delta":40}]}],"payment_addr":"NIXNBEqCTmqw89joe0m71Z9MrkkBcF1t1ri+9BZehKw=","num_msat":"400000","features":{"9":{"name":"tlv-onion","is_required":false,"is_known":true},"15":{"name":"payment-addr","is_required":false,"is_known":true},"17":{"name":"multi-path-payments","is_required":false,"is_known":true}},"btc_num_satoshis":"0.000004"};
    component.onSendPayment();
    expect(spyOnSendPayment).toHaveBeenCalled();
    // component.onPaymentRequestEntry('lntb4u1psvdzaypp55');
    // component.onPaymentRequestEntry('lntb1ps8neg8pp5u897fhxxzg068jzt59tgqe458jt7srjtd6k93x4t9ts3hqdkd2nsdpj23jhxarfdenjq3tdwp68jgzfdemx76trv5sxvmmjypxyu3pqxvxqyd9uqcqp2sp5feg8wftf3fasmp2fe86kehyqfat2xcrjvunare7rrn28yjdrw8yqrzjq2m42d94jc8fxjzq675cmhr7fpjg0vr6238xutxp9p78yeaucwjfjxgpcuqqqxsqqyqqqqlgqqqqqqgq9q9qy9qsqwf6a4w9uqthm3aslwt03ucqt03e8j2atxrmt022d5kaw65cmqc3pnghz5xmsh2tlz9syhaulrxtwmvh3gdx9j33gec6yrycwh2g05qgqdnftgk');
    // component.onPaymentRequestEntry('lntb4u1psvdzaypp555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp5xjzu6pz2sf8x4v8nmr58kjdm6k05etjfq9c96mwkhzl0g9j7sjkqrzjq28vwprzypa40c75myejm8s2aenkeykcnd7flvy9plp2yjq56nvrc8ss5cqqqzgqqqqqqqlgqqqqqqgq9q9qy9qsqpt6u4rwfrck3tmpn54kdxjx3xdch62t5wype2f44mmlar07y749xt9elhfhf6dnlfk2tjwg3qpy8njh6remphfcc0630aq38j0s3hrgpv4eel3');
    // component.onPaymentRequestEntry('p555uks3f6774kl3vdy2dfr00j847pyxtrqelsdnczuxnmtqv99srsdpy23jhxarfdenjqmn8wfuzq3txvejkxarnyq6qcqp2sp3434dsfdsf');
  });


  it('should call ngOnDestroy', () => {
    const spyOnNgOnDestroy: jasmine.Spy = spyOn(component, 'ngOnDestroy');
    component.ngOnDestroy();
    expect(spyOnNgOnDestroy).toHaveBeenCalled();
  });  

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});

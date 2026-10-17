import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';
import { SharedModule } from '../../../shared/shared.module';
import { RTLEffects } from '../../../store/rtl.effects';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { LightningPaymentsComponent } from './lightning-payments.component';
import { sendPayment } from '../../store/lnd.actions';

describe('LightningPaymentsComponent', () => {
  let component: LightningPaymentsComponent;
  let fixture: ComponentFixture<LightningPaymentsComponent>;
  let closeConfirm: Subject<any>;
  let dispatchSpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [LightningPaymentsComponent],
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
        { provide: RTLEffects, useClass: mockRTLEffects }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightningPaymentsComponent);
    component = fixture.componentInstance;
    component.calledFrom = 'home';
    fixture.detectChanges();
    closeConfirm = new Subject<any>();
    (<any>TestBed.inject(RTLEffects)).closeConfirm = closeConfirm;
    dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch');
  });

  const sentPayment = () => dispatchSpy.calls.allArgs().map(([action]) => action).find((action: any) => action.type === sendPayment.type);
  const confirmationFields = () => {
    const confirmation: any = dispatchSpy.calls.allArgs().map(([action]) => action).find((action: any) => action.payload?.data?.alertTitle?.includes('Confirm Send Payment'));
    return [].concat(...confirmation.payload.data.message);
  };

  it('should show the default fee limit and send the payment with it', () => {
    component.paymentRequest = 'lnbcrt100u1-test';
    component.paymentDecoded = { payment_hash: 'ab', num_satoshis: '10000' };
    component.sendPayment();
    expect(confirmationFields().find((field) => field.key === 'fee_limit_sat')).toEqual(jasmine.objectContaining({ value: 500, title: 'Max Fee (Sats)' }));
    closeConfirm.next(true);
    expect(sentPayment().payload.fee_limit_sat).toBe(500);
  });

  it('should send a zero amount invoice with the default fee limit for the entered amount', () => {
    component.paymentRequest = 'lnbcrt1-test';
    component.paymentDecoded = { payment_hash: 'ab', num_satoshis: '0' };
    component.sendPayment();
    closeConfirm.next([{ inputValue: 80 }]);
    expect(sentPayment().payload).toEqual(jasmine.objectContaining({ amt: 80, fee_limit_sat: 80 }));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

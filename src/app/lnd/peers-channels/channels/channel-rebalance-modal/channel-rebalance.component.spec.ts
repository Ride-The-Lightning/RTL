import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';

import { ChannelRebalanceComponent } from './channel-rebalance.component';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockLoggerService, mockMatDialogRef, mockRTLEffects, mockDataService } from '../../../../shared/test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FEE_LIMIT_TYPES, LNDActions } from '../../../../shared/services/consts-enums-functions';

describe('ChannelRebalanceComponent', () => {
  let component: ChannelRebalanceComponent;
  let fixture: ComponentFixture<ChannelRebalanceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ChannelRebalanceComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { message: { selChannel: {}, channels: [] } } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChannelRebalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('fee limit', () => {
    let dispatch: jasmine.Spy;

    beforeEach(() => {
      dispatch = spyOn(TestBed.inject(Store), 'dispatch');
    });

    const setFeeLimit = (amount: number, typeId: string, feeLimit: number) => {
      component.inputFormGroup.controls.rebalanceAmount.setValue(amount);
      component.inputFormGroup.controls.selRebalancePeer.setValue({ remote_pubkey: '02'.padEnd(66, 'a') });
      component.feeFormGroup.controls.selFeeLimitType.setValue(FEE_LIMIT_TYPES.find((type) => type.id === typeId));
      component.feeFormGroup.controls.feeLimit.setValue(feeLimit);
    };
    const sentFeeLimitSat = () => {
      component.sendPayment('lnbcrt1example');
      const payments = dispatch.calls.allArgs().map((args) => args[0]).filter((action) => action.type === LNDActions.SEND_PAYMENT_LND);
      expect(payments.length).toBe(1);
      return payments[0].payload.fee_limit_sat;
    };

    it('sends a fractional percentage as that share of the amount', () => {
      setFeeLimit(20000, 'percent', 2.5);
      expect(sentFeeLimitSat()).toBe(500);
    });

    it('rounds a fractional percentage of a small amount up to whole sats', () => {
      setFeeLimit(50, 'percent', 2.5);
      expect(sentFeeLimitSat()).toBe(2);
    });

    it('sends a whole percentage as that share of the amount', () => {
      setFeeLimit(20000, 'percent', 2);
      expect(sentFeeLimitSat()).toBe(400);
    });

    it('sends a fixed limit as entered', () => {
      setFeeLimit(20000, 'fixed', 30);
      expect(sentFeeLimitSat()).toBe(30);
    });

    it('shows the fee limit and its Sats in the fee step label once rebalancing starts', () => {
      setFeeLimit(20000, 'percent', 2.5);
      component.stepSelectionChanged({ selectedIndex: 2, previouslySelectedIndex: 1 });
      expect(component.feeFormLabel).toBe('Percentage Limit: 2.5 | Max fee: 500 Sats');
    });

    it('shows the fee limit in Sats before rebalancing', () => {
      setFeeLimit(20000, 'percent', 2.5);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Max fee: 500 Sats');
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

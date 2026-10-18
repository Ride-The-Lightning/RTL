import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';

import { ECLChannelRebalanceComponent } from './channel-rebalance.component';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockLoggerService, mockMatDialogRef, mockRTLEffects, mockDataService } from '../../../../shared/test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FEE_LIMIT_TYPES } from '../../../../shared/services/consts-enums-functions';

const SOURCE_CHANNEL = { channelId: 'c1', shortChannelId: '1x1x0', nodeId: 'source-node', alias: 'bob', toLocal: 50000, toRemote: 50000 };
const TARGET_CHANNEL = { channelId: 'c3', shortChannelId: '3x1x0', nodeId: 'target-node', alias: 'alice', toLocal: 50000, toRemote: 50000 };

describe('ECLChannelRebalanceComponent', () => {
  let component: ECLChannelRebalanceComponent;
  let fixture: ComponentFixture<ECLChannelRebalanceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLChannelRebalanceComponent],
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
        { provide: MAT_DIALOG_DATA, useValue: { message: { information: { nodeId: 'own-node' }, selChannel: SOURCE_CHANNEL, channels: [SOURCE_CHANNEL, TARGET_CHANNEL] } } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelRebalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('max fee', () => {
    let circularRebalance: jasmine.Spy;

    beforeEach(() => {
      circularRebalance = jasmine.createSpy('circularRebalance').and.returnValue(of({ flgReusingInvoice: false, invoice: 'lnbcrt1', paymentRoute: '1x1x0,2x1x0,3x1x0', paymentHash: 'ab', paymentDetails: {}, paymentStatus: { type: 'sent', feesPaid: 1050 } }));
      (TestBed.inject(DataService) as any).circularRebalance = circularRebalance;
      component.inputFormGroup.controls.rebalanceAmount.setValue(30000);
      component.inputFormGroup.controls.selRebalancePeer.setValue(TARGET_CHANNEL);
    });

    const setFeeLimit = (typeId: string, feeLimit: number | null) => {
      component.inputFormGroup.controls.selFeeLimitType.setValue(FEE_LIMIT_TYPES.find((type) => type.id === typeId));
      component.inputFormGroup.controls.feeLimit.setValue(feeLimit);
      fixture.detectChanges();
    };

    const sentMaxFeeMsat = () => circularRebalance.calls.mostRecent().args[6];

    it('sends the default limit, 5% of the amount, when none is set', () => {
      component.onRebalance();
      expect(circularRebalance).toHaveBeenCalledTimes(1);
      expect(sentMaxFeeMsat()).toBe(1500000);
    });

    it('sends a fixed limit in msats', () => {
      setFeeLimit('fixed', 200);
      component.onRebalance();
      expect(sentMaxFeeMsat()).toBe(200000);
    });

    it('sends a zero fixed limit as zero', () => {
      setFeeLimit('fixed', 0);
      component.onRebalance();
      expect(sentMaxFeeMsat()).toBe(0);
    });

    it('sends a percentage limit as that share of the amount', () => {
      setFeeLimit('percent', 1);
      component.onRebalance();
      expect(sentMaxFeeMsat()).toBe(300000);
    });

    it('does not rebalance when a fixed limit is chosen but left empty', () => {
      setFeeLimit('fixed', null);
      component.onRebalance();
      expect(circularRebalance).not.toHaveBeenCalled();
      expect(component.inputFormGroup.controls.feeLimit.errors?.required).toBeTrue();
    });

    it('shows the max fee before the rebalance is sent', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Max fee: 1,500 Sats');
      setFeeLimit('fixed', 250);
      expect(fixture.nativeElement.textContent).toContain('Max fee: 250 Sats');
    });

    it('keeps the amount, peer and max fee in view once the rebalance is sent', () => {
      fixture.detectChanges();
      component.onRebalance();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Rebalancing Amount: 30,000 Sats | Peer: alice | Max Fee: 1,500 Sats');
    });

    it('keeps a negative limit reported as negative, not as missing', () => {
      setFeeLimit('fixed', -5);
      component.onRebalance();
      expect(circularRebalance).not.toHaveBeenCalled();
      expect(component.inputFormGroup.controls.feeLimit.errors?.min).toBeTruthy();
      expect(component.inputFormGroup.controls.feeLimit.errors?.required).toBeUndefined();
    });

    const rebalanceWith = (rebalanceRes: any) => {
      circularRebalance.and.returnValue(of({ flgReusingInvoice: false, invoice: 'lnbcrt1', paymentHash: 'ab', paymentDetails: {}, ...rebalanceRes }));
      fixture.detectChanges();
      component.onRebalance();
      fixture.detectChanges();
      return fixture.nativeElement.textContent;
    };

    it('gives no verdict while the payment is pending', () => {
      const text = rebalanceWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'pending' } });
      expect(text).toContain('Payment status pending...');
      expect(text).not.toContain('Rebalance Successful.');
      expect(text).not.toContain('Rebalance Failed.');
    });

    it('shows a failed payment as failed, with its reason, on the route it used', () => {
      const text = rebalanceWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'failed', error: 'Payment not sent. Nothing was paid. The route costs 20,001.08 Sats in fees.' } });
      expect(text).toContain('Rebalance Failed.');
      expect(text).not.toContain('Rebalance Successful.');
      expect(text).toContain('Payment not sent. Nothing was paid. The route costs 20,001.08 Sats in fees.');
      expect(text).toContain('Route used');
      expect(text).not.toContain('Route failed');
    });

    it('shows an unknown payment status as unknown, without offering to rebalance again', () => {
      const text = rebalanceWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'unknown', error: 'Payment status unknown. Check Payments before trying again.' } });
      expect(text).toContain('Payment status unknown');
      expect(text).toContain('Rebalance status unknown.');
      expect(text).toContain('Check Payments before trying again.');
      expect(text).not.toContain('Rebalance Failed.');
      expect(text).not.toContain('Payment failed');
      expect(text).not.toContain('Start Again');
    });

    const canGoBackToFirstStep = () => {
      component.stepper.selectedIndex = 0;
      fixture.detectChanges();
      return component.stepper.selectedIndex === 0;
    };

    it('does not let the same rebalance be sent again while its status is unknown or pending', () => {
      rebalanceWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'unknown', error: 'Payment status unknown. Check Payments before trying again.' } });
      expect(canGoBackToFirstStep()).toBeFalse();
      component.onRestart();
      component.inputFormGroup.controls.rebalanceAmount.setValue(30000);
      component.inputFormGroup.controls.selRebalancePeer.setValue(TARGET_CHANNEL);
      rebalanceWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'pending' } });
      expect(canGoBackToFirstStep()).toBeFalse();
    });

    it('lets a new rebalance be set up once the payment has succeeded or failed', () => {
      rebalanceWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'sent', feesPaid: 1050 } });
      expect(canGoBackToFirstStep()).toBeTrue();
      rebalanceWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'failed', error: 'Payment not sent. Nothing was paid.' } });
      expect(canGoBackToFirstStep()).toBeTrue();
    });

    // DataService rethrows the HTTP status with the body, as `{ httpStatus, body }`.
    const rebalanceFailingWith = (errorBody: any, httpStatus = 500) => {
      circularRebalance.and.returnValue(throwError(() => ({ httpStatus: httpStatus, body: errorBody })));
      fixture.detectChanges();
      component.onRebalance();
      fixture.detectChanges();
      return fixture.nativeElement.textContent;
    };

    it('does not let the same rebalance be sent again when the backend answers with an unknown status', () => {
      const text = rebalanceFailingWith({ paymentRoute: '1x1x0,2x1x0,3x1x0', paymentStatus: { type: 'unknown', error: 'Payment status unknown. Check Payments before trying again.' } });
      expect(text).toContain('Rebalance status unknown.');
      expect(text).not.toContain('Start Again');
      expect(canGoBackToFirstStep()).toBeFalse();
    });

    it('treats an error without a payment status, such as a proxy timeout, as unknown', () => {
      const text = rebalanceFailingWith('<html>504 Gateway Time-out</html>', 504);
      expect(text).toContain('Rebalance status unknown.');
      expect(text).toContain('Check Payments before trying again.');
      expect(text).not.toContain('Rebalance Failed.');
      expect(text).not.toContain('Route failed');
      expect(text).not.toContain('Start Again');
      expect(canGoBackToFirstStep()).toBeFalse();
    });

    it('treats a request that got no answer as unknown', () => {
      const text = rebalanceFailingWith(null, 0);
      expect(text).toContain('Rebalance status unknown.');
      expect(canGoBackToFirstStep()).toBeFalse();
    });

    it('shows a request refused before the rebalance ran as failed, with its message', () => {
      const text = rebalanceFailingWith('Invalid CSRF token, form tempered.', 403);
      expect(text).toContain('Rebalance Failed.');
      expect(text).toContain('Invalid CSRF token, form tempered.');
      expect(text).not.toContain('Rebalance status unknown.');
      expect(canGoBackToFirstStep()).toBeTrue();
    });

    it('shows an error carrying only a payment status without breaking the dialog', () => {
      const text = rebalanceFailingWith({ message: 'Eclair node not found', error: 'Eclair node not found', paymentStatus: { error: 'Eclair node not found' } }, 500);
      expect(text).toContain('Rebalance Failed.');
      expect(text).toContain('Eclair node not found');
      expect(text).not.toContain('Invoice generated');
      expect(canGoBackToFirstStep()).toBeTrue();
    });

    it('lets a new rebalance be set up after a definite failure', () => {
      const text = rebalanceFailingWith({ paymentRoute: '', paymentStatus: { error: 'No route found between the two peers other than through this node.' } });
      expect(text).toContain('Rebalance Failed.');
      expect(text).toContain('Start Again');
      expect(canGoBackToFirstStep()).toBeTrue();
    });

    it('shows a route lookup failure as a failed route', () => {
      const text = rebalanceWith({ paymentRoute: '', paymentStatus: { error: 'No route found between the two peers other than through this node.' } });
      expect(text).toContain('Route failed');
      expect(text).toContain('Rebalance Failed.');
    });

    it('goes back to the default limit on Start Again', () => {
      setFeeLimit('fixed', 250);
      component.onRestart();
      expect(component.inputFormGroup.controls.selFeeLimitType.value).toEqual(FEE_LIMIT_TYPES[0]);
      component.inputFormGroup.controls.rebalanceAmount.setValue(30000);
      component.inputFormGroup.controls.selRebalancePeer.setValue(TARGET_CHANNEL);
      component.onRebalance();
      expect(sentMaxFeeMsat()).toBe(1500000);
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

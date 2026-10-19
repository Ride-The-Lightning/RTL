import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ScannedActionsSubject, Store, StoreModule } from '@ngrx/store';
import { Subject, throwError } from 'rxjs';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLOnChainSendModalComponent } from './on-chain-send-modal.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { EffectsModule } from '@ngrx/effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';

import { APICallStatusEnum, ECLActions } from '../../../shared/services/consts-enums-functions';

describe('ECLOnChainSendModalComponent', () => {
  let component: ECLOnChainSendModalComponent;
  let fixture: ComponentFixture<ECLOnChainSendModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLOnChainSendModalComponent],
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
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLOnChainSendModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sending an amount in another unit', () => {
    let dispatch: jasmine.Spy;

    beforeEach(() => {
      dispatch = spyOn(TestBed.inject(Store), 'dispatch');
      component.fiatConversion = true;
      component.amountUnits = ['Sats', 'BTC', 'USD'];
      component.transaction = { address: 'bcrt1qexampleaddress', amount: 10, blocks: 6 };
    });

    const sentPayloads = () => dispatch.calls.allArgs().map((args) => args[0]).filter((action) => action.type === ECLActions.SEND_ONCHAIN_FUNDS_ECL).map((action) => action.payload);
    const render = () => {
      fixture.detectChanges();
      return fixture.nativeElement.textContent;
    };

    it('asks to confirm a fiat amount, showing the Sats it will send, before sending', () => {
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      const text = render();
      // 10 USD at the mocked rate of 33,438.82 USD per BTC.
      expect(text).toContain('29,905 Sats');
      expect(text).toContain('10.00 USD at 1 BTC = 33,438.82 USD');
      expect(sentPayloads().length).toBe(0);
      component.onConfirmSend();
      expect(sentPayloads().length).toBe(1);
      expect(sentPayloads()[0].amount).toBe(29905);
    });

    it('drops the confirmation when the amount is changed', async () => {
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      expect(render()).toContain('29,905 Sats');
      // Template-driven ngModel binds its input once the form settles.
      await fixture.whenStable();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="amt"]');
      input.value = '20';
      input.dispatchEvent(new Event('input'));
      expect(render()).not.toContain('29,905 Sats');
      component.onConfirmSend();
      expect(sentPayloads().length).toBe(0);
    });

    it('sends an amount in Sats without asking', () => {
      component.onSendFunds();
      expect(sentPayloads().length).toBe(1);
      expect(sentPayloads()[0].amount).toBe(10);
    });

    it('keeps the unit and shows the error when the conversion fails, and sends nothing', () => {
      spyOn(TestBed.inject(DataService), 'getFiatRates').and.returnValue(throwError(() => 'rates down'));
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      expect(render()).toContain('Conversion Error');
      expect(component.selAmountUnit).toBe('USD');
      component.onSendFunds();
      component.onConfirmSend();
      expect(sentPayloads().length).toBe(0);
    });

    it('sends the target blocks chosen while the confirmation is shown', () => {
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      expect(render()).toContain('29,905 Sats');
      component.transaction.blocks = 12;
      component.onConfirmSend();
      expect(sentPayloads().length).toBe(1);
      expect(sentPayloads()[0].blocks).toBe(12);
    });

    it('sends once when Confirm Send is clicked twice', () => {
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      component.onConfirmSend();
      component.onConfirmSend();
      expect(sentPayloads().length).toBe(1);
    });

    it('shows no error from a conversion the operator has moved on from', () => {
      const conversion = new Subject<{ sats: number, summary: string }>();
      spyOn(TestBed.inject(CommonService), 'convertToSendSats').and.returnValue(conversion);
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      // What the amount input does when it is edited.
      component.transaction.amount = 20;
      component.clearSendConfirmation();
      conversion.error('Currency Conversion Error.');
      expect(render()).not.toContain('Conversion Error');
    });

    it('applies a unit picked while the amount is empty', () => {
      component.transaction.amount = null;
      component.onAmountUnitChange({ value: 'BTC' });
      expect(component.selAmountUnit).toBe('BTC');
      component.transaction.amount = 0.0002;
      component.onSendFunds();
      expect(render()).toContain('20,000 Sats');
      component.onConfirmSend();
      expect(sentPayloads()[0].amount).toBe(20000);
    });

    it('keeps the confirmation and says why when the form is incomplete at Confirm Send', () => {
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      expect(render()).toContain('29,905 Sats');
      // Clearing Target Confirmation Blocks.
      component.transaction.blocks = null;
      component.onConfirmSend();
      const text = render();
      expect(sentPayloads().length).toBe(0);
      expect(text).toContain('29,905 Sats');
      expect(text).toContain('Please fill in all the required fields.');
    });

    it('drops the required-fields error once the corrected form is confirmed', () => {
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      component.transaction.blocks = null;
      component.onConfirmSend();
      expect(render()).toContain('Please fill in all the required fields.');
      component.transaction.blocks = 6;
      component.onConfirmSend();
      expect(sentPayloads().length).toBe(1);
      expect(render()).not.toContain('Please fill in all the required fields.');
    });

    it('sends nothing more while a send is in progress, until it fails', () => {
      const sendFundsButton = () => Array.from(fixture.nativeElement.querySelectorAll('button')).find((button: HTMLButtonElement) => button.textContent.trim() === 'Send Funds') as HTMLButtonElement;
      component.selAmountUnit = 'USD';
      component.onSendFunds();
      component.onConfirmSend();
      expect(render()).not.toContain('29,905 Sats');
      expect(sendFundsButton().disabled).toBeTrue();
      // The second click of a double-click lands on Send Funds.
      component.onSendFunds();
      expect(render()).not.toContain('29,905 Sats');
      expect(sentPayloads().length).toBe(1);
      TestBed.inject(ScannedActionsSubject).next({ type: ECLActions.UPDATE_API_CALL_STATUS_ECL, payload: { action: 'SendOnchainFunds', status: APICallStatusEnum.ERROR, message: 'insufficient funds' } } as any);
      expect(render()).toContain('insufficient funds');
      expect(sendFundsButton().disabled).toBeFalse();
      component.onSendFunds();
      expect(render()).toContain('29,905 Sats');
    });

    it('sends an amount in Sats once while the send is in progress', () => {
      component.onSendFunds();
      component.onSendFunds();
      expect(sentPayloads().length).toBe(1);
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

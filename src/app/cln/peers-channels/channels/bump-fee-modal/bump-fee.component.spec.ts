import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { DataService } from '../../../../shared/services/data.service';
import { throwError } from 'rxjs';
import { APICallStatusEnum, CLNActions, RTLActions } from '../../../../shared/services/consts-enums-functions';
import { RTLState } from '../../../../store/rtl.state';
import { setChannelTransactionRes, setNewAddress, updateCLNAPICallStatus } from '../../../store/cln.actions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SharedModule } from '../../../../shared/shared.module';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockLoggerService, mockMatDialogRef, mockRTLEffects } from '../../../../shared/test-helpers/mock-services';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CLNBumpFeeComponent } from './bump-fee.component';

describe('CLNBumpFeeComponent', () => {
  let component: CLNBumpFeeComponent;
  let fixture: ComponentFixture<CLNBumpFeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CLNBumpFeeComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { channel: {} } },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNBumpFeeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send the fee rate in Sats/vByte as whole sats per 1000 vBytes', () => {
    const store = TestBed.inject(Store);
    const dispatch = spyOn(store, 'dispatch').and.callThrough();
    component.bumpFeeChannel = <any>{ funding_txid: 'aa'.repeat(32) };
    component.outputIndex = 0;
    component.fees = 16.1;
    component.onBumpFee();
    store.dispatch(setNewAddress({ payload: 'bcrt1qexampleaddress' }));
    const sent = dispatch.calls.allArgs().map((args) => <any>args[0]).filter((action) => action.type === CLNActions.SET_CHANNEL_TRANSACTION_CLN);
    expect(sent.length).toBe(1);
    expect(sent[0].payload.feerate).toBe('16100perkb');
  });

  describe('after it sends the fee bump', () => {
    let store: Store<RTLState>;
    let dispatch: jasmine.Spy;

    beforeEach(() => {
      store = TestBed.inject(Store);
      dispatch = spyOn(store, 'dispatch').and.callThrough();
      component.bumpFeeChannel = <any>{ funding_txid: 'aa'.repeat(32) };
      component.outputIndex = 0;
      component.fees = 5;
      component.onBumpFee();
    });

    it('should spend the bumped output to the address its own request returned', () => {
      const sent = dispatch.calls.allArgs().map((args) => <any>args[0]).filter((action) => action.type === CLNActions.SET_CHANNEL_TRANSACTION_CLN);
      expect(sent.length).toBe(1);
      expect(sent[0].payload).toEqual({ destination: 'bcrt1qmocknewaddress', satoshi: 'all', feerate: '5000perkb', utxos: ['aa'.repeat(32) + ':0'] });
    });

    it('should report success and close when the transaction is sent', () => {
      const close = spyOn(TestBed.inject(MatDialogRef), 'close');
      store.dispatch(setChannelTransactionRes({ payload: { txid: 'bb'.repeat(32) } }));
      expect(dispatch.calls.allArgs().map((args) => <any>args[0]).filter((action) => action.type === RTLActions.OPEN_SNACK_BAR).length).toBe(1);
      expect(close).toHaveBeenCalled();
    });

    it('should show the error and stay open when the transaction fails', () => {
      const close = spyOn(TestBed.inject(MatDialogRef), 'close');
      store.dispatch(updateCLNAPICallStatus({ payload: { action: 'SetChannelTransaction', status: APICallStatusEnum.ERROR, message: 'Insufficient funds' } }));
      expect(component.bumpFeeError).toBe('Insufficient funds');
      expect(close).not.toHaveBeenCalled();
    });
  });

  describe('when its address request fails', () => {
    let store: Store<RTLState>;
    let dispatch: jasmine.Spy;
    const dispatched = (type: string) => dispatch.calls.allArgs().map((args) => <any>args[0]).filter((action) => action.type === type);

    beforeEach(() => {
      store = TestBed.inject(Store);
      dispatch = spyOn(store, 'dispatch').and.callThrough();
      (<any>TestBed.inject(DataService)).getNewAddress = () => throwError(() => new Error('Generate New Address Failed'));
      component.bumpFeeChannel = <any>{ funding_txid: 'aa'.repeat(32) };
      component.outputIndex = 0;
      component.fees = 5;
      component.onBumpFee();
    });

    it('should show the error and send nothing', () => {
      expect(component.bumpFeeError).toBe('Generate New Address Failed');
      expect(dispatched(CLNActions.SET_CHANNEL_TRANSACTION_CLN).length).toBe(0);
    });

    it('should not spend to an address generated on another screen after it closes', () => {
      fixture.destroy();
      store.dispatch(setNewAddress({ payload: 'bcrt1qaddressfromreceive' }));
      expect(dispatched(CLNActions.SET_CHANNEL_TRANSACTION_CLN).length).toBe(0);
    });

    it('should not report another screen\'s on-chain send as its own after it closes', () => {
      fixture.destroy();
      store.dispatch(setChannelTransactionRes({ payload: { txid: 'bb'.repeat(32) } }));
      expect(dispatched(RTLActions.OPEN_SNACK_BAR).length).toBe(0);
    });
  });
});

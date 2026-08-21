import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { APICallStatusEnum, LNDActions } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

import { setBalanceBlockchain, updateLNDAPICallStatus } from '../../store/lnd.actions';
import { ConnectPeerComponent } from './connect-peer.component';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects, mockDataService } from '../../../shared/test-helpers/mock-services';
import { LNDEffects } from '../../store/lnd.effects';
import { SharedModule } from '../../../shared/shared.module';
import { EffectsModule } from '@ngrx/effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ConnectPeerComponent', () => {
  let component: ConnectPeerComponent;
  let fixture: ComponentFixture<ConnectPeerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ConnectPeerComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService, LoggerService,
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { message: {} } },
        { provide: LNDEffects, useClass: mockLNDEffects },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectPeerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should clear and release the amount field while fund max is on', () => {
    component.channelFormGroup.controls.fundingAmount.setValue(250000);

    component.channelFormGroup.controls.fundMax.setValue(true);
    expect(component.channelFormGroup.controls.fundingAmount.value).toEqual('');
    expect(component.channelFormGroup.controls.fundingAmount.disabled).toBe(true);
    // An amount is no longer required, so the step is not held back by an empty field.
    expect(component.channelFormGroup.controls.fundingAmount.errors).toBeNull();

    component.channelFormGroup.controls.fundMax.setValue(false);
    expect(component.channelFormGroup.controls.fundingAmount.disabled).toBe(false);
    component.channelFormGroup.controls.fundingAmount.updateValueAndValidity();
    expect(component.channelFormGroup.controls.fundingAmount.errors?.required).toBeTruthy();
  });

  it('should open the channel with fund max and no funding amount when the toggle is on', () => {
    const dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch');
    component.newlyAddedPeer = { pub_key: 'peer-pubkey' };
    component.channelFormGroup.controls.fundMax.setValue(true);

    component.onOpenChannel();

    const dispatched = dispatchSpy.calls.allArgs().map((args) => args[0]).find((action: any) => action.type === LNDActions.SAVE_NEW_CHANNEL_LND);
    expect(dispatched).toBeDefined();
    expect((<any>dispatched).payload.fundMax).toBe(true);
    expect((<any>dispatched).payload.fundingAmount).toBeNull();
  });

  it('should disable the fund max control when the wallet is all anchor reserve', () => {
    const store = TestBed.inject(Store);
    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 40000, reserved_balance_anchor_chan: 40000 } }));
    expect(component.spendableBalance).toEqual(0);
    expect(component.channelFormGroup.controls.fundMax.disabled).toBe(true);

    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));
    expect(component.spendableBalance).toEqual(4715574);
    expect(component.channelFormGroup.controls.fundMax.disabled).toBe(false);
  });

  it('should keep a typed amount when an unrelated LND action re-emits the balance', () => {
    const store = TestBed.inject(Store);
    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));
    component.channelFormGroup.controls.fundingAmount.setValue(250000);

    // A failed open leaves the dialog open and dispatches an API status update; the balance
    // selector projects a fresh object off the whole LND state, so it re-emits on any action.
    store.dispatch(updateLNDAPICallStatus({ payload: { action: 'SaveNewChannel', status: APICallStatusEnum.ERROR, message: 'Insufficient funds' } }));

    expect(component.channelFormGroup.controls.fundingAmount.value).toEqual(250000);
    expect(component.channelFormGroup.controls.fundingAmount.disabled).toBe(false);
  });

  it('should keep a typed amount when a deposit makes the wallet spendable again', () => {
    const store = TestBed.inject(Store);
    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 40000, reserved_balance_anchor_chan: 40000 } }));
    component.channelFormGroup.controls.fundingAmount.setValue(250000);

    // A deposit confirming while the stepper is open releases the toggle; the amount the user
    // typed against the manual path must survive it.
    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));

    expect(component.channelFormGroup.controls.fundMax.disabled).toBe(false);
    expect(component.channelFormGroup.controls.fundingAmount.value).toEqual(250000);
  });

  it('should keep a typed amount when the wallet drops to all anchor reserve', () => {
    const store = TestBed.inject(Store);
    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));
    component.channelFormGroup.controls.fundingAmount.setValue(250000);

    // The toggle is off here, so disabling it must not emit — the fund max handler would
    // clear the amount the user typed against the manual path.
    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 40000, reserved_balance_anchor_chan: 40000 } }));

    expect(component.channelFormGroup.controls.fundMax.disabled).toBe(true);
    expect(component.channelFormGroup.controls.fundingAmount.value).toEqual(250000);
    expect(component.channelFormGroup.controls.fundingAmount.enabled).toBe(true);
  });

  it('should release the amount field when the wallet drops out while fund max is on', () => {
    const store = TestBed.inject(Store);
    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));
    component.channelFormGroup.controls.fundMax.setValue(true);
    expect(component.channelFormGroup.controls.fundingAmount.disabled).toBe(true);

    store.dispatch(setBalanceBlockchain({ payload: { total_balance: 40000, reserved_balance_anchor_chan: 40000 } }));

    expect(component.channelFormGroup.controls.fundMax.value).toBe(false);
    expect(component.channelFormGroup.controls.fundMax.disabled).toBe(true);
    expect(component.channelFormGroup.controls.fundingAmount.disabled).toBe(false);
  });

  it('should label the channel step with the fund max state', () => {
    component.channelFormGroup.controls.fundMax.setValue(true);
    component.stepSelectionChanged({ selectedIndex: 1, previouslySelectedIndex: 0 });
    expect(component.channelFormLabel).toEqual('Opening Channel for the Entire Wallet Balance');

    component.channelFormGroup.controls.fundMax.setValue(false);
    component.channelFormGroup.controls.fundingAmount.setValue(250000);
    component.stepSelectionChanged({ selectedIndex: 1, previouslySelectedIndex: 0 });
    expect(component.channelFormLabel).toEqual('Opening Channel for 250000 Sats');
  });

  it('should not open the channel without an amount when fund max is off', () => {
    const dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch');
    component.newlyAddedPeer = { pub_key: 'peer-pubkey' };
    component.channelFormGroup.controls.fundMax.setValue(false);
    component.channelFormGroup.controls.fundingAmount.setValue('');

    expect(component.onOpenChannel()).toBe(true);
    expect(dispatchSpy.calls.allArgs().map((args) => args[0]).find((action: any) => action.type === LNDActions.SAVE_NEW_CHANNEL_LND)).toBeUndefined();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects, mockDataService } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';
import { RTLEffects } from '../../../../store/rtl.effects';
import { CommonService } from '../../../../shared/services/common.service';
import { DataService } from '../../../../shared/services/data.service';
import { LNDActions } from '../../../../shared/services/consts-enums-functions';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { setBalanceBlockchain } from '../../../store/lnd.actions';
import { OpenChannelComponent } from './open-channel.component';

const configureModule = (dialogData: any) => TestBed.configureTestingModule({
  declarations: [OpenChannelComponent],
  imports: [
    BrowserAnimationsModule,
    SharedModule,
    StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
    EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
  ],
  providers: [
    CommonService,
    { provide: MatDialogRef, useClass: mockMatDialogRef },
    { provide: MAT_DIALOG_DATA, useValue: dialogData },
    { provide: RTLEffects, useClass: mockRTLEffects },
    { provide: DataService, useClass: mockDataService }
  ]
}).
  compileComponents();

describe('OpenChannelComponent', () => {
  let component: OpenChannelComponent;
  let fixture: ComponentFixture<OpenChannelComponent>;

  beforeEach(waitForAsync(() => {
    configureModule({ message: { information: {} } });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

describe('OpenChannelComponent fund max', () => {
  let component: OpenChannelComponent;
  let fixture: ComponentFixture<OpenChannelComponent>;
  let dispatchSpy: jasmine.Spy;

  // Each case needs its own dialog data, so the module is configured per test rather than
  // in a beforeEach — compileComponents() must be awaited or the fixture is built against
  // an uncompiled SharedModule, which only happens to work when another spec compiled it first.
  const buildComponent = async (version: string) => {
    await configureModule({ message: { information: { version: version }, balance: 500000 } });
    fixture = TestBed.createComponent(OpenChannelComponent);
    component = fixture.componentInstance;
    // callThrough so store-driven state (the blockchain balance) still updates.
    dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch').and.callThrough();
    fixture.detectChanges();
  };

  const dispatchedNewChannel = () => dispatchSpy.calls.allArgs().map((args) => args[0]).find((action) => action.type === LNDActions.SAVE_NEW_CHANNEL_LND);

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should offer fund max on LND 0.16.0 and above', async () => {
    await buildComponent('0.18.3-beta commit=v0.18.3-beta');
    expect(component.isFundMaxAvailable).toBe(true);
  });

  it('should not offer fund max below LND 0.16.0', async () => {
    await buildComponent('0.15.5-beta commit=v0.15.5-beta');
    expect(component.isFundMaxAvailable).toBe(false);
  });

  it('should open the channel with fund max and no funding amount when the toggle is on', async () => {
    await buildComponent('0.18.3-beta');
    component.selectedPubkey = 'peer-pubkey';
    component.fundMax = true;
    component.onFundMaxChange();
    expect(component.fundingAmount).toBeNull();

    component.onOpenChannel();

    const dispatched = dispatchedNewChannel();
    expect(dispatched).toBeDefined();
    expect(dispatched.payload.fundMax).toBe(true);
    expect(dispatched.payload.fundingAmount).toBeNull();
    expect(dispatched.payload.selectedPeerPubkey).toEqual('peer-pubkey');
  });

  it('should still require an amount when fund max is off', async () => {
    await buildComponent('0.18.3-beta');
    component.selectedPubkey = 'peer-pubkey';
    component.fundMax = false;
    component.fundingAmount = null;

    expect(component.onOpenChannel()).toBe(true);
    expect(dispatchedNewChannel()).toBeUndefined();
  });

  it('should treat a wallet that is all anchor reserve as having nothing spendable', async () => {
    await buildComponent('0.18.3-beta');
    // A wallet can report a balance while every sat of it is the reserve LND keeps back.
    TestBed.inject(Store).dispatch(setBalanceBlockchain({ payload: { total_balance: 40000, confirmed_balance: 40000, reserved_balance_anchor_chan: 40000 } }));
    expect(component.spendableBalance).toEqual(0);

    TestBed.inject(Store).dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, confirmed_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));
    expect(component.spendableBalance).toEqual(4715574);
  });

  it('should disable the fund max toggle when nothing is spendable', async () => {
    await buildComponent('0.18.3-beta');
    const fundMaxToggle = () => fixture.debugElement.queryAll(By.directive(MatSlideToggle)).
      map((el) => el.componentInstance).find((toggle) => toggle.name === 'fundMax');

    TestBed.inject(Store).dispatch(setBalanceBlockchain({ payload: { total_balance: 40000, confirmed_balance: 40000, reserved_balance_anchor_chan: 40000 } }));
    fixture.detectChanges();
    expect(fundMaxToggle().disabled).toBe(true);

    TestBed.inject(Store).dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, confirmed_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));
    fixture.detectChanges();
    expect(fundMaxToggle().disabled).toBe(false);
  });

  it('should turn fund max back off when the spendable balance runs out', async () => {
    await buildComponent('0.18.3-beta');
    TestBed.inject(Store).dispatch(setBalanceBlockchain({ payload: { total_balance: 4745574, confirmed_balance: 4745574, reserved_balance_anchor_chan: 30000 } }));
    component.fundMax = true;
    component.onFundMaxChange();

    // The toggle only greys out, so left on it would still send fund_max for a wallet the
    // node cannot fund from.
    TestBed.inject(Store).dispatch(setBalanceBlockchain({ payload: { total_balance: 40000, confirmed_balance: 40000, reserved_balance_anchor_chan: 40000 } }));
    expect(component.fundMax).toBe(false);
  });

  it('should not offer fund max while the only balance is unconfirmed', async () => {
    await buildComponent('0.18.3-beta');
    const toggleByName = (name: string) => fixture.debugElement.queryAll(By.directive(MatSlideToggle)).
      map((el) => el.componentInstance).find((toggle) => toggle.name === name);
    const clickToggle = (name: string) => fixture.debugElement.queryAll(By.directive(MatSlideToggle)).
      find((el) => el.componentInstance.name === name).nativeElement.querySelector('button').click();

    // fund_max draws on coins meeting the node's min-confs policy, so an unconfirmed-only
    // wallet reads as funded but has nothing fund max can commit.
    TestBed.inject(Store).dispatch(setBalanceBlockchain({ payload: { total_balance: 500000, confirmed_balance: 0, unconfirmed_balance: 500000, reserved_balance_anchor_chan: 0 } }));
    fixture.detectChanges();
    expect(component.spendableBalance).toEqual(0);
    expect(toggleByName('fundMax').disabled).toBe(true);

    // Asking to spend unconfirmed output moves min-confs to 0, so those coins now count.
    clickToggle('spendUnconfirmed');
    fixture.detectChanges();
    expect(component.spendUnconfirmed).toBe(true);
    expect(component.spendableBalance).toEqual(500000);
    expect(toggleByName('fundMax').disabled).toBe(false);

    clickToggle('spendUnconfirmed');
    fixture.detectChanges();
    expect(component.spendUnconfirmed).toBe(false);
    expect(component.spendableBalance).toEqual(0);
    expect(component.fundMax).toBe(false);
    expect(toggleByName('fundMax').disabled).toBe(true);
  });

  it('should open the channel with the entered amount when fund max is off', async () => {
    await buildComponent('0.18.3-beta');
    component.selectedPubkey = 'peer-pubkey';
    component.fundMax = false;
    component.fundingAmount = 250000;

    component.onOpenChannel();

    const dispatched = dispatchedNewChannel();
    expect(dispatched).toBeDefined();
    expect(dispatched.payload.fundMax).toBe(false);
    expect(dispatched.payload.fundingAmount).toEqual(250000);
  });
});

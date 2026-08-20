import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
    dispatchSpy = spyOn(TestBed.inject(Store), 'dispatch');
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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { Store, StoreModule } from '@ngrx/store';
import { DataService } from '../../../../shared/services/data.service';
import { CLNActions } from '../../../../shared/services/consts-enums-functions';
import { setNewAddress } from '../../../store/cln.actions';
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
});

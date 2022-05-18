import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';
import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CLNOpenLiquidityChannelComponent } from './open-liquidity-channel-modal.component';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockMatDialogRef, mockRTLEffects } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';

describe('CLNOpenLiquidityChannelComponent', () => {
  let component: CLNOpenLiquidityChannelComponent;
  let fixture: ComponentFixture<CLNOpenLiquidityChannelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNOpenLiquidityChannelComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { message: {} } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNOpenLiquidityChannelComponent);
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

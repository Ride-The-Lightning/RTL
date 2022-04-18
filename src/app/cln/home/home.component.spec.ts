import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../../shared/shared.module';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../shared/test-helpers/mock-services';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../cln/store/cl.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { CLNHomeComponent } from './home.component';
import { CLNNodeInfoComponent } from './node-info/node-info.component';
import { CLNBalancesInfoComponent } from './balances-info/balances-info.component';
import { CLNChannelCapacityInfoComponent } from './channel-capacity-info/channel-capacity-info.component';
import { CLNChannelStatusInfoComponent } from './channel-status-info/channel-status-info.component';
import { CLNFeeInfoComponent } from './fee-info/fee-info.component';
import { DataService } from '../../shared/services/data.service';

describe('CLHomeComponent', () => {
  let component: CLHomeComponent;
  let fixture: ComponentFixture<CLHomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLHomeComponent, CLNodeInfoComponent, CLBalancesInfoComponent, CLChannelCapacityInfoComponent, CLChannelStatusInfoComponent, CLFeeInfoComponent],
      imports: [
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLHomeComponent);
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

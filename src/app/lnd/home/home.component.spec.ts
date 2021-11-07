import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLReducer } from '../../clightning/store/cl.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import { HomeComponent } from './home.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../shared/test-helpers/mock-services';
import { SharedModule } from '../../shared/shared.module';
import { ChannelStatusInfoComponent } from './channel-status-info/channel-status-info.component';
import { ChannelCapacityInfoComponent } from './channel-capacity-info/channel-capacity-info.component';
import { ChannelLiquidityInfoComponent } from './channel-liquidity-info/channel-liquidity-info.component';
import { BalancesInfoComponent } from './balances-info/balances-info.component';
import { FeeInfoComponent } from './fee-info/fee-info.component';
import { NodeInfoComponent } from './node-info/node-info.component';
import { EffectsModule } from '@ngrx/effects';
import { DataService } from '../../shared/services/data.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HomeComponent, BalancesInfoComponent, ChannelCapacityInfoComponent, ChannelLiquidityInfoComponent, ChannelStatusInfoComponent, FeeInfoComponent, NodeInfoComponent],
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
    fixture = TestBed.createComponent(HomeComponent);
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

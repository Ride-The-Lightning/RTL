import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../shared/services/common.service';
import { DataService } from '../../shared/services/data.service';
import { LoggerService } from '../../shared/services/logger.service';
import { mockDataService, mockLoggerService } from '../../shared/test-helpers/mock-services';
import { SharedModule } from '../../shared/shared.module';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../cln/store/cl.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { CLNFeeRatesComponent } from './fee-rates/fee-rates.component';
import { CLNOnChainFeeEstimatesComponent } from './on-chain-fee-estimates/on-chain-fee-estimates.component';
import { CLNNetworkInfoComponent } from './network-info.component';

describe('CLNetworkInfoComponent', () => {
  let component: CLNetworkInfoComponent;
  let fixture: ComponentFixture<CLNetworkInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNetworkInfoComponent, CLFeeRatesComponent, CLOnChainFeeEstimatesComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer })
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
    fixture = TestBed.createComponent(CLNetworkInfoComponent);
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

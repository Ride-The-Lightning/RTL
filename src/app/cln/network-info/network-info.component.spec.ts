import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../shared/services/common.service';
import { DataService } from '../../shared/services/data.service';
import { LoggerService } from '../../shared/services/logger.service';
import { mockDataService, mockLoggerService } from '../../shared/test-helpers/mock-services';
import { SharedModule } from '../../shared/shared.module';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../cln/store/cln.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { CLNFeeRatesComponent } from './fee-rates/fee-rates.component';
import { CLNOnChainFeeEstimatesComponent } from './on-chain-fee-estimates/on-chain-fee-estimates.component';
import { CLNNetworkInfoComponent } from './network-info.component';

describe('CLNNetworkInfoComponent', () => {
  let component: CLNNetworkInfoComponent;
  let fixture: ComponentFixture<CLNNetworkInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNNetworkInfoComponent, CLNFeeRatesComponent, CLNOnChainFeeEstimatesComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
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
    fixture = TestBed.createComponent(CLNNetworkInfoComponent);
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

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../shared/services/common.service';
import { DataService } from '../../shared/services/data.service';
import { LoggerService } from '../../shared/services/logger.service';
import { mockDataService, mockLoggerService } from '../../shared/test-helpers/mock-services';
import { SharedModule } from '../../shared/shared.module';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLFeeRatesComponent } from './fee-rates/fee-rates.component';
import { CLNetworkInfoComponent } from './network-info.component';

describe('CLNetworkInfoComponent', () => {
  let component: CLNetworkInfoComponent;
  let fixture: ComponentFixture<CLNetworkInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNetworkInfoComponent, CLFeeRatesComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
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

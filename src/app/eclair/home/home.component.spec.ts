import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../store/rtl.reducers';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import { ECLHomeComponent } from './home.component';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../shared/test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../shared/shared.module';
import { ECLNodeInfoComponent } from './node-info/node-info.component';
import { ECLBalancesInfoComponent } from './balances-info/balances-info.component';
import { ECLChannelCapacityInfoComponent } from './channel-capacity-info/channel-capacity-info.component';
import { ECLFeeInfoComponent } from './fee-info/fee-info.component';
import { ECLChannelStatusInfoComponent } from './channel-status-info/channel-status-info.component';
import { DataService } from '../../shared/services/data.service';

describe('ECLHomeComponent', () => {
  let component: ECLHomeComponent;
  let fixture: ComponentFixture<ECLHomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLHomeComponent, ECLNodeInfoComponent, ECLBalancesInfoComponent, ECLChannelCapacityInfoComponent, ECLFeeInfoComponent, ECLChannelStatusInfoComponent],
      imports: [ 
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLHomeComponent);
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

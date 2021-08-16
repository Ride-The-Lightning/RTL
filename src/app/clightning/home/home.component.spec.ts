import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { SharedModule } from '../../shared/shared.module';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';
import { mockCLEffects, mockDataService, mockLoggerService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../shared/test-helpers/mock-services';

import { RTLReducer } from '../../store/rtl.reducers';
import { CLHomeComponent } from './home.component';
import { CLNodeInfoComponent } from './node-info/node-info.component';
import { CLBalancesInfoComponent } from './balances-info/balances-info.component';
import { CLChannelCapacityInfoComponent } from './channel-capacity-info/channel-capacity-info.component';
import { CLChannelStatusInfoComponent } from './channel-status-info/channel-status-info.component';
import { CLFeeInfoComponent } from './fee-info/fee-info.component';
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

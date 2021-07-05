import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { LoggerService } from '../../../shared/services/logger.service';
import { LoopService } from '../../../shared/services/loop.service';

import { ChannelLiquidityInfoComponent } from './channel-liquidity-info.component';
import { SharedModule } from '../../../shared/shared.module';
import { mockDataService } from '../../../shared/test-helpers/test-consts';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

describe('ChannelLiquidityInfoComponent', () => {
  let component: ChannelLiquidityInfoComponent;
  let fixture: ComponentFixture<ChannelLiquidityInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ChannelLiquidityInfoComponent ],
      imports: [ 
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        LoggerService, CommonService, LoopService,
        { provide: DataService, useClass: mockDataService }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ChannelLiquidityInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});

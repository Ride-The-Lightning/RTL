import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { CLChannelPendingTableComponent } from './channel-pending-table.component';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../../../shared/services/test-consts';
import { EffectsModule } from '@ngrx/effects';
import { ECLEffects } from '../../../../../eclair/store/ecl.effects';
import { CLEffects } from '../../../../store/cl.effects';
import { LNDEffects } from '../../../../../lnd/store/lnd.effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { SharedModule } from '../../../../../shared/shared.module';

describe('CLChannelPendingTableComponent', () => {
  let component: CLChannelPendingTableComponent;
  let fixture: ComponentFixture<CLChannelPendingTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelPendingTableComponent ],
      imports: [
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([RTLEffects, LNDEffects, CLEffects, ECLEffects])
      ],
      providers: [
        LoggerService,
        { provide: RTLEffects, useValue: mockRTLEffects },
        { provide: LNDEffects, useValue: mockLNDEffects },
        { provide: CLEffects, useClass: mockCLEffects },
        { provide: ECLEffects, useValue: mockECLEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelPendingTableComponent);
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

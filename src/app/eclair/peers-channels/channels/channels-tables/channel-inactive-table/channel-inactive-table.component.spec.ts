import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { ECLChannelInactiveTableComponent } from './channel-inactive-table.component';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../../../shared/services/test-consts';
import { EffectsModule } from '@ngrx/effects';
import { RTLEffects } from '../../../../../store/rtl.effects';
import { SharedModule } from '../../../../../shared/shared.module';

describe('ECLChannelInactiveTableComponent', () => {
  let component: ECLChannelInactiveTableComponent;
  let fixture: ComponentFixture<ECLChannelInactiveTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLChannelInactiveTableComponent ],
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
        LoggerService,
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]

    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLChannelInactiveTableComponent);
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

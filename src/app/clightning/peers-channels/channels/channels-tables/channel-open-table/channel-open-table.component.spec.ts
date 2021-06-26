import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../../../../shared/services/common.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../../../shared/services/test-consts';
import { SharedModule } from '../../../../../shared/shared.module';
import { RTLEffects } from '../../../../../store/rtl.effects';

import { RTLReducer } from '../../../../../store/rtl.reducers';
import { CLEffects } from '../../../../store/cl.effects';
import { CLChannelOpenTableComponent } from './channel-open-table.component';

describe('CLChannelOpenTableComponent', () => {
  let component: CLChannelOpenTableComponent;
  let fixture: ComponentFixture<CLChannelOpenTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLChannelOpenTableComponent ],
      imports: [
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([mockRTLEffects, mockLNDEffects, mockCLEffects, mockECLEffects])
      ],
      providers: [
        LoggerService,
        { provide: CommonService, useClass: mockCommonService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: CLEffects, useClass: mockCLEffects }        
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLChannelOpenTableComponent);
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

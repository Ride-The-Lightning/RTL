import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { CommonService } from '../../../../../shared/services/common.service';
import { DataService } from '../../../../../shared/services/data.service';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../../../shared/test-helpers/test-consts';
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
        BrowserAnimationsModule,
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
        LoggerService, CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: CLEffects, useClass: mockCLEffects }        
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(CLChannelOpenTableComponent);
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

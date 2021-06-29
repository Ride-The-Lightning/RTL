import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';


import { RTLReducer } from '../../../../store/rtl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SessionService } from '../../../../shared/services/session.service';

import { SideNavigationComponent } from './side-navigation.component';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../services/test-consts';
import { EffectsModule } from '@ngrx/effects';
import { RTLEffects } from '../../../../store/rtl.effects';
import { SharedModule } from '../../../shared.module';

describe('SideNavigationComponent', () => {
  let component: SideNavigationComponent;
  let fixture: ComponentFixture<SideNavigationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SideNavigationComponent ],
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
        LoggerService, SessionService, 
        { provide: RTLEffects, useClass: mockRTLEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavigationComponent);
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

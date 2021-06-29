import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SessionService } from '../../../../shared/services/session.service';

import { AuthSettingsComponent } from './auth-settings.component';
import { SharedModule } from '../../../shared.module';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../services/test-consts';
import { EffectsModule } from '@ngrx/effects';

describe('AuthSettingsComponent', () => {
  let component: AuthSettingsComponent;
  let fixture: ComponentFixture<AuthSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthSettingsComponent ],
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
      providers: [ LoggerService, SessionService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthSettingsComponent);
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

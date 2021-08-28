import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SessionService } from '../../../../shared/services/session.service';

import { AuthSettingsComponent } from './auth-settings.component';
import { SharedModule } from '../../../shared.module';
import { mockCLEffects, mockECLEffects, mockLNDEffects, mockRTLEffects, mockLoggerService } from '../../../test-helpers/mock-services';
import { EffectsModule } from '@ngrx/effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('AuthSettingsComponent', () => {
  let component: AuthSettingsComponent;
  let fixture: ComponentFixture<AuthSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AuthSettingsComponent],
      imports: [
        BrowserAnimationsModule,
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
        SessionService,
        { provide: LoggerService, useClass: mockLoggerService }
      ]
    }).
      compileComponents();
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

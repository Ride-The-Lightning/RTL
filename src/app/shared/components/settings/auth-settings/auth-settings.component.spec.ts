import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { LoggerService } from '../../../../shared/services/logger.service';
import { SessionService } from '../../../../shared/services/session.service';

import { AuthSettingsComponent } from './auth-settings.component';

describe('AuthSettingsComponent', () => {
  let component: AuthSettingsComponent;
  let fixture: ComponentFixture<AuthSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthSettingsComponent ],
      imports: [ RouterTestingModule, 
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
, provideMockActions ],
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
});

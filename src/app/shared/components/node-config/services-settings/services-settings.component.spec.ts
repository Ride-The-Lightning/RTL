import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../../store/rtl.reducers';
import { SharedModule } from '../../../shared.module';
import { BoltzServiceSettingsComponent } from './boltz-service-settings/boltz-service-settings.component';
import { LoopServiceSettingsComponent } from './loop-service-settings/loop-service-settings.component';
import { ServicesSettingsComponent } from './services-settings.component';

describe('ServicesSettingsComponent', () => {
  let component: ServicesSettingsComponent;
  let fixture: ComponentFixture<ServicesSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ServicesSettingsComponent, LoopServiceSettingsComponent, BoltzServiceSettingsComponent ],
      imports: [ 
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(ServicesSettingsComponent);
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

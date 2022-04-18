import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cl.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { SharedModule } from '../../../shared.module';
import { BoltzServiceSettingsComponent } from './boltz-service-settings/boltz-service-settings.component';
import { LoopServiceSettingsComponent } from './loop-service-settings/loop-service-settings.component';
import { ServicesSettingsComponent } from './services-settings.component';

describe('ServicesSettingsComponent', () => {
  let component: ServicesSettingsComponent;
  let fixture: ComponentFixture<ServicesSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ServicesSettingsComponent, LoopServiceSettingsComponent, BoltzServiceSettingsComponent],
      imports: [
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer })
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesSettingsComponent);
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

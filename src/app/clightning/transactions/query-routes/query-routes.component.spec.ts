import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { CLQueryRoutesComponent } from './query-routes.component';
import { mockCLEffects, mockDataService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/test-helpers/test-consts';
import { CLEffects } from '../../store/cl.effects';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';

describe('CLQueryRoutesComponent', () => {
  let component: CLQueryRoutesComponent;
  let fixture: ComponentFixture<CLQueryRoutesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLQueryRoutesComponent ],
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
        CommonService,
        { provide: DataService, useClass: mockDataService },
        { provide: CLEffects, useClass: mockCLEffects }
      ]
    })
    .compileComponents();
    fixture = TestBed.createComponent(CLQueryRoutesComponent);
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

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../../store/rtl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { CLQueryRoutesComponent } from './query-routes.component';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../../shared/services/test-consts';
import { RTLEffects } from '../../../store/rtl.effects';
import { LNDEffects } from '../../../lnd/store/lnd.effects';
import { CLEffects } from '../../store/cl.effects';
import { ECLEffects } from '../../../eclair/store/ecl.effects';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../../shared/shared.module';



describe('CLQueryRoutesComponent', () => {
  let component: CLQueryRoutesComponent;
  let fixture: ComponentFixture<CLQueryRoutesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CLQueryRoutesComponent ],
      imports: [
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        }),
        EffectsModule.forRoot([RTLEffects, LNDEffects, CLEffects, ECLEffects])
      ],
      providers: [ 
        { provide: RTLEffects, useValue: mockRTLEffects },
        { provide: LNDEffects, useValue: mockLNDEffects },
        { provide: CLEffects, useClass: mockCLEffects },
        { provide: ECLEffects, useValue: mockECLEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLQueryRoutesComponent);
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

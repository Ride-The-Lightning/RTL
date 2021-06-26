import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RTLReducer } from '../../store/rtl.reducers';
import { CommonService } from '../../shared/services/common.service';
import { LoggerService } from '../../shared/services/logger.service';

import { ECLLookupsComponent } from './lookups.component';
import { mockCLEffects, mockCommonService, mockECLEffects, mockLNDEffects, mockRTLEffects } from '../../shared/services/test-consts';
import { EffectsModule } from '@ngrx/effects';
import { SharedModule } from '../../shared/shared.module';

describe('ECLLookupsComponent', () => {
  let component: ECLLookupsComponent;
  let fixture: ComponentFixture<ECLLookupsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLLookupsComponent ],
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
        { provide: CommonService, useClass: mockCommonService }
      ]
 
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLLookupsComponent);
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

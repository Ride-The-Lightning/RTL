import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { mockCommonService, mockECLEffects } from '../../../shared/services/test-consts';
import { SharedModule } from '../../../shared/shared.module';
import { RTLReducer } from '../../../store/rtl.reducers';
import { ECLEffects } from '../../store/ecl.effects';

import { ECLQueryRoutesComponent } from './query-routes.component';

describe('ECLQueryRoutesComponent', () => {
  let component: ECLQueryRoutesComponent;
  let fixture: ComponentFixture<ECLQueryRoutesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ECLQueryRoutesComponent ],
      imports: [ 
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        LoggerService,
        { provide: ECLEffects, useClass: mockECLEffects },
        { provide: CommonService, useClass: mockCommonService }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLQueryRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

});

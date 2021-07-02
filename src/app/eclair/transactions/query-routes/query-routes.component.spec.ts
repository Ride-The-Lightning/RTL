import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { mockDataService, mockECLEffects } from '../../../shared/services/test-consts';
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
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot(RTLReducer, {
          runtimeChecks: {
            strictStateImmutability: false,
            strictActionImmutability: false
          }
        })
      ],
      providers: [
        LoggerService, CommonService, 
        { provide: DataService, useClass: mockDataService },
        { provide: ECLEffects, useClass: mockECLEffects }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLQueryRoutesComponent);
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

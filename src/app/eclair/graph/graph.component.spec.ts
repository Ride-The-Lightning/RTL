import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLReducer } from '../../clightning/store/cl.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { LoggerService } from '../../shared/services/logger.service';

import { ECLGraphComponent } from './graph.component';
import { SharedModule } from '../../shared/shared.module';
import { mockDataService, mockLoggerService } from '../../shared/test-helpers/mock-services';
import { CommonService } from '../../shared/services/common.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../shared/services/data.service';

describe('ECLGraphComponent', () => {
  let component: ECLGraphComponent;
  let fixture: ComponentFixture<ECLGraphComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLGraphComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLGraphComponent);
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

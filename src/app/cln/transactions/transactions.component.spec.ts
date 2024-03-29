import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../store/rtl.reducers';
import { LNDReducer } from '../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../cln/store/cln.reducers';
import { ECLReducer } from '../../eclair/store/ecl.reducers';
import { LoggerService } from '../../shared/services/logger.service';

import { CLNTransactionsComponent } from './transactions.component';
import { SharedModule } from '../../shared/shared.module';
import { CLNQueryRoutesComponent } from '../graph/query-routes/query-routes.component';
import { mockDataService, mockLoggerService } from '../../shared/test-helpers/mock-services';
import { CommonService } from '../../shared/services/common.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../shared/services/data.service';

describe('CLNTransactionsComponent', () => {
  let component: CLNTransactionsComponent;
  let fixture: ComponentFixture<CLNTransactionsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNTransactionsComponent, CLNQueryRoutesComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        RouterTestingModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
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
    fixture = TestBed.createComponent(CLNTransactionsComponent);
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

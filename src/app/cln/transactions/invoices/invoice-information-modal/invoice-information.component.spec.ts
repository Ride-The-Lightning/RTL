import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { CLNInvoiceInformationComponent } from './invoice-information.component';
import { mockDataService, mockLoggerService, mockMatDialogRef } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';
import { DataService } from '../../../../shared/services/data.service';
import { RTLState } from '../../../../store/rtl.state';
import { listInvoices } from '../../../store/cln.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { ListInvoices } from '../../../../shared/models/clnModels';

describe('CLNInvoiceInformationComponent', () => {
  let component: CLNInvoiceInformationComponent;
  let fixture: ComponentFixture<CLNInvoiceInformationComponent>;
  let store: Store<RTLState>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNInvoiceInformationComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: LoggerService, useClass: mockLoggerService },
        { provide: DataService, useClass: mockDataService },
        { provide: MatDialogRef, useClass: mockMatDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { invoice: {} } }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CLNInvoiceInformationComponent);
    component = fixture.componentInstance;
    store = fixture.debugElement.injector.get(Store);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

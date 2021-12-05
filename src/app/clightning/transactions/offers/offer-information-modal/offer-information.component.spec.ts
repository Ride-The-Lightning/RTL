import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../../store/rtl.reducers';
import { LNDReducer } from '../../../../lnd/store/lnd.reducers';
import { CLReducer } from '../../../store/cl.reducers';
import { ECLReducer } from '../../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';

import { CLOfferInformationComponent } from './offer-information.component';
import { mockDataService, mockLoggerService, mockMatDialogRef } from '../../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../../shared/shared.module';
import { DataService } from '../../../../shared/services/data.service';
import { RTLState } from '../../../../store/rtl.state';
import { listInvoices } from '../../../store/cl.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';
import { ListInvoices } from '../../../../shared/models/clModels';

describe('CLOfferInformationComponent', () => {
  let component: CLOfferInformationComponent;
  let fixture: ComponentFixture<CLOfferInformationComponent>;
  let store: Store<RTLState>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLOfferInformationComponent],
      imports: [
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cl: CLReducer, ecl: ECLReducer })
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
    fixture = TestBed.createComponent(CLOfferInformationComponent);
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

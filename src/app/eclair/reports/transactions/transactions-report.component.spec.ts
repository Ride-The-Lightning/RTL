import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { setPayments } from '../../../eclair/store/ecl.actions';
import { CommonService } from '../../../shared/services/common.service';

import { ECLTransactionsReportComponent } from './transactions-report.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';

describe('ECLTransactionsReportComponent', () => {
  let component: ECLTransactionsReportComponent;
  let fixture: ComponentFixture<ECLTransactionsReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ECLTransactionsReportComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
        StoreModule.forRoot({ root: RootReducer, lnd: LNDReducer, cln: CLNReducer, ecl: ECLReducer })
      ],
      providers: [
        CommonService,
        { provide: DataService, useClass: mockDataService }
      ]
    }).
      compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECLTransactionsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should report received amounts from the audit received payments, not the paged invoice list', () => {
    // The invoice list is served one page at a time (#1067), so the received side of the
    // report has to come from the audit, which is bounded and already in the store.
    const inPeriod = component.startDate.getTime() + (60 * 60 * 1000);
    const beforePeriod = component.startDate.getTime() - (24 * 60 * 60 * 1000);
    const received = (amounts: number[], firstPartTimestamp: number) => ({ type: 'payment-received', paymentHash: 'hash' + firstPartTimestamp, firstPartTimestamp, parts: amounts.map((amount) => ({ amount, fromChannelId: 'chan', timestamp: firstPartTimestamp })) });
    const store = TestBed.inject(Store);
    store.dispatch(setPayments({ payload: { sent: [], received: [received([55], inPeriod), received([56], inPeriod + 1000), received([50, 7], inPeriod + 2000), received([1000], beforePeriod)], relayed: [] } }));
    fixture.detectChanges();
    expect(component.transactionsReportSummary.invoicesSelectedPeriod).toBe(3);
    expect(component.transactionsReportSummary.amountReceivedSelectedPeriod).toBe(168);
    expect(component.transactionsNonZeroReportData.length).toBe(1);
    expect(component.transactionsNonZeroReportData[0].num_invoices).toBe(3);
    expect(component.transactionsNonZeroReportData[0].amount_received).toBe(168);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

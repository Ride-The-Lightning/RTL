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
import { DST_REPORT_CASES, daysWithEntries } from '../../../shared/test-helpers/dst-report-cases';

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

  describe('monthly report across a daylight-saving change (#1331)', () => {
    DST_REPORT_CASES.forEach((dst) => {
      describe('with a payment and an invoice in ' + dst.label, () => {
        beforeEach(() => {
          component.payments = [{ firstPartTimestamp: dst.at.getTime(), recipientAmount: 1000 }] as any[];
          component.invoices = [{ status: 'received', timestamp: Math.floor(dst.at.getTime() / 1000), amountSettled: 1000 }] as any[];
          component.onSelectionChange({ selDate: new Date(dst.at.getFullYear(), dst.at.getMonth(), 1), selScrollRange: 'MONTHLY' });
        });

        it('should book both to day ' + dst.day, () => {
          expect(component.transactionsReportData.length).toBe(dst.day);
          expect(daysWithEntries(component.transactionsReportData, (day) => day.series[0].extra.total)).toEqual([dst.day]);
          expect(daysWithEntries(component.transactionsReportData, (day) => day.series[1].extra.total)).toEqual([dst.day]);
        });

        it('should date every day of that month as that day', () => {
          expect(component.transactionsReportData.map((day) => day.date.getDate())).toEqual(component.transactionsReportData.map((day) => +day.name));
          expect(component.transactionsNonZeroReportData.map((row) => row.date.getDate())).toEqual([dst.day]);
        });
      });
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';

import { TransactionsReportComponent } from './transactions-report.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DST_REPORT_CASES, daysWithEntries } from '../../../shared/test-helpers/dst-report-cases';

describe('TransactionsReportComponent', () => {
  let component: TransactionsReportComponent;
  let fixture: ComponentFixture<TransactionsReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TransactionsReportComponent],
      imports: [
        BrowserAnimationsModule,
        SharedModule,
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
    fixture = TestBed.createComponent(TransactionsReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('monthly report across a daylight-saving change (#1331)', () => {
    DST_REPORT_CASES.forEach((dst) => {
      describe('with a payment and an invoice in ' + dst.label, () => {
        beforeEach(() => {
          const seconds = Math.floor(dst.at.getTime() / 1000);
          component.payments = [{ status: 'SUCCEEDED', creation_date: seconds, value_msat: '1000000', fee_msat: '1000' }] as any[];
          component.invoices = [{ settled: true, creation_date: seconds.toString(), amt_paid_msat: '1000000' }] as any[];
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

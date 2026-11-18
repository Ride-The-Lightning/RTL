import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../../lnd/store/lnd.reducers';
import { CLNReducer } from '../../store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLNRoutingReportComponent } from './routing-report.component';
import { mockDataService, mockLoggerService } from '../../../shared/test-helpers/mock-services';
import { SharedModule } from '../../../shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataService } from '../../../shared/services/data.service';
import { DST_REPORT_CASES, daysWithEntries } from '../../../shared/test-helpers/dst-report-cases';

describe('CLNRoutingReportComponent', () => {
  let component: CLNRoutingReportComponent;
  let fixture: ComponentFixture<CLNRoutingReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CLNRoutingReportComponent],
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
    fixture = TestBed.createComponent(CLNRoutingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('monthly report across a daylight-saving change (#1331)', () => {
    DST_REPORT_CASES.forEach((dst) => {
      const select = () => {
        component.events = [{ received_time: dst.at.getTime() / 1000, in_msat: 1000000, out_msat: 999000, fee_msat: 1000, status: 'settled' }];
        component.onSelectionChange({ selDate: new Date(dst.at.getFullYear(), dst.at.getMonth(), 1), selScrollRange: 'MONTHLY' });
      };

      it('should book a forward in ' + dst.label + ' to day ' + dst.day + ' of the fee report', () => {
        component.selReportBy = component.reportBy.FEES;
        select();
        expect(component.routingReportData.length).toBe(dst.day);
        expect(daysWithEntries(component.routingReportData, (day) => day.extra.totalEvents)).toEqual([dst.day]);
      });

      it('should book a forward in ' + dst.label + ' to day ' + dst.day + ' of the events report', () => {
        component.selReportBy = component.reportBy.EVENTS;
        select();
        expect(component.routingReportData.length).toBe(dst.day);
        expect(daysWithEntries(component.routingReportData, (day) => day.value)).toEqual([dst.day]);
      });
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });
});

import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { RootReducer } from '../../../store/rtl.reducers';
import { LNDReducer } from '../../store/lnd.reducers';
import { CLNReducer } from '../../../cln/store/cln.reducers';
import { ECLReducer } from '../../../eclair/store/ecl.reducers';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';

import { RoutingReportComponent } from './routing-report.component';
import { SharedModule } from '../../../shared/shared.module';
import { mockDataService } from '../../../shared/test-helpers/mock-services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DST_REPORT_CASES, daysWithEntries } from '../../../shared/test-helpers/dst-report-cases';
import { of } from 'rxjs';

describe('RoutingReportComponent', () => {
  let component: RoutingReportComponent;
  let fixture: ComponentFixture<RoutingReportComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [RoutingReportComponent],
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
    fixture = TestBed.createComponent(RoutingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('monthly report across a daylight-saving change (#1331)', () => {
    DST_REPORT_CASES.forEach((dst) => {
      const select = () => {
        spyOn(TestBed.inject(DataService), 'getForwardingHistory').and.returnValue(of({ forwarding_events: [
          { timestamp: Math.floor(dst.at.getTime() / 1000).toString(), amt_in: '1000', amt_out: '999', fee: '1', fee_msat: '1000' }
        ] }));
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

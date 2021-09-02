import { Component, OnInit, OnDestroy, HostListener, AfterContentInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SwitchRes } from '../../../shared/models/lndModels';
import { CommonService } from '../../../shared/services/common.service';
import { MONTHS, ScreenSizeEnum, SCROLL_RANGES, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { DataService } from '../../../shared/services/data.service';
import { fadeIn } from '../../../shared/animation/opacity-animation';

import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as fromLNDReducer from '../../store/lnd.reducers';

@Component({
  selector: 'rtl-fee-report',
  templateUrl: './fee-report.component.html',
  styleUrls: ['./fee-report.component.scss'],
  animations: [fadeIn]
})
export class FeeReportComponent implements OnInit, AfterContentInit, OnDestroy {

  public reportPeriod = SCROLL_RANGES[0];
  public secondsInADay = 24 * 60 * 60;
  public events: SwitchRes = {};
  public eventFilterValue = '';
  public today = new Date(Date.now());
  public startDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1, 0, 0, 0);
  public endDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.getMonthDays(this.today.getMonth(), this.today.getFullYear()), 23, 59, 59);
  public feeReportData: any = [];
  public view: [number, number] = [350, 350];
  public screenPaddingX = 100;
  public gradient = true;
  public xAxisLabel = 'Date';
  public yAxisLabel = 'Fee (Sats)';
  public showYAxisLabel = true;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private dataService: DataService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.showYAxisLabel = !(this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM);
    this.store.select(fromLNDReducer.getInformation).pipe(takeUntil(this.unSubs[0])).subscribe((info) => {
      if (info.identity_pubkey) {
        this.fetchEvents(this.startDate, this.endDate);
      }
    });
  }

  ngAfterContentInit() {
    const CONTAINER_SIZE = this.commonService.getContainerSize();
    switch (this.screenSize) {
      case ScreenSizeEnum.MD:
        this.screenPaddingX = CONTAINER_SIZE.width / 10;
        break;

      case ScreenSizeEnum.LG:
        this.screenPaddingX = CONTAINER_SIZE.width / 16;
        break;

      default:
        this.screenPaddingX = CONTAINER_SIZE.width / 20;
        break;
    }
    this.view = [CONTAINER_SIZE.width - this.screenPaddingX, CONTAINER_SIZE.height / 2.2];
  }

  fetchEvents(start: Date, end: Date) {
    this.errorMessage = UI_MESSAGES.GET_FEE_REPORT;
    const startDateInSeconds = Math.round(start.getTime() / 1000).toString();
    const endDateInSeconds = Math.round(end.getTime() / 1000).toString();
    this.dataService.getForwardingHistory(startDateInSeconds, endDateInSeconds).
      pipe(takeUntil(this.unSubs[1])).subscribe({ next: (res) => {
        this.errorMessage = '';
        if (res.forwarding_events && res.forwarding_events.length) {
          res.forwarding_events = res.forwarding_events.reverse();
          this.events = res;
          this.feeReportData = this.prepareFeeReport(start);
        } else {
          this.events = {};
          this.feeReportData = [];
        }
      }, error: (err) => {
        this.errorMessage = err;
      } });
  }

  @HostListener('mouseup', ['$event']) onChartMouseUp(e) {
    if (e.srcElement.tagName === 'svg' && e.srcElement.classList.length > 0 && e.srcElement.classList[0] === 'ngx-charts') {
      this.eventFilterValue = '';
    }
  }

  onChartBarSelected(event) {
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      this.eventFilterValue = event.name + '/' + this.startDate.getFullYear();
    } else {
      this.eventFilterValue = event.name.toString().padStart(2, '0') + '/' + MONTHS[this.startDate.getMonth()].name + '/' + this.startDate.getFullYear();
    }
  }

  prepareFeeReport(start: Date) {
    const startDateInSeconds = Math.round(start.getTime() / 1000);
    const feeReport = [];
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      for (let i = 0; i < 12; i++) {
        feeReport.push({ name: MONTHS[i].name, value: 0.000000001, extra: { totalEvents: 0 } });
      }
      this.events.forwarding_events.map((event) => {
        const monthNumber = new Date((+event.timestamp) * 1000).getMonth();
        feeReport[monthNumber].value = feeReport[monthNumber].value + (+event.fee_msat / 1000);
        feeReport[monthNumber].extra.totalEvents = feeReport[monthNumber].extra.totalEvents + 1;
        this.events.total_fee_msat = (this.events.total_fee_msat ? this.events.total_fee_msat : 0) + +event.fee_msat;
        return this.events;
      });
    } else {
      for (let i = 0; i < this.getMonthDays(start.getMonth(), start.getFullYear()); i++) {
        feeReport.push({ name: i + 1, value: 0.000000001, extra: { totalEvents: 0 } });
      }
      this.events.forwarding_events.map((event) => {
        const dateNumber = Math.floor((+event.timestamp - startDateInSeconds) / this.secondsInADay);
        feeReport[dateNumber].value = feeReport[dateNumber].value + (+event.fee_msat / 1000);
        feeReport[dateNumber].extra.totalEvents = feeReport[dateNumber].extra.totalEvents + 1;
        this.events.total_fee_msat = (this.events.total_fee_msat ? this.events.total_fee_msat : 0) + +event.fee_msat;
        return this.events;
      });
    }
    return feeReport;
  }

  onSelectionChange(selectedValues: {selDate: Date, selScrollRange: string}) {
    const selMonth = selectedValues.selDate.getMonth();
    const selYear = selectedValues.selDate.getFullYear();
    this.reportPeriod = selectedValues.selScrollRange;
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      this.startDate = new Date(selYear, 0, 1, 0, 0, 0);
      this.endDate = new Date(selYear, 11, 31, 23, 59, 59);
    } else {
      this.startDate = new Date(selYear, selMonth, 1, 0, 0, 0);
      this.endDate = new Date(selYear, selMonth, this.getMonthDays(selMonth, selYear), 23, 59, 59);
    }
    this.fetchEvents(this.startDate, this.endDate);
    this.eventFilterValue = '';
  }

  getMonthDays(selMonth: number, selYear: number) {
    return (selMonth === 1 && selYear % 4 === 0) ? (MONTHS[selMonth].days + 1) : MONTHS[selMonth].days;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

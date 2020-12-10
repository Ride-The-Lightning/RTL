import { Component, OnInit, OnDestroy, HostListener, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ForwardingHistoryRes, ForwardingEvent } from '../../../shared/models/clModels';
import { MONTHS, ScreenSizeEnum, SCROLL_RANGES } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { DataService } from '../../../shared/services/data.service';
import { fadeIn } from '../../../shared/animation/opacity-animation';

import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-fee-report',
  templateUrl: './fee-report.component.html',
  styleUrls: ['./fee-report.component.scss'],
  animations: [fadeIn]
})
export class CLFeeReportComponent implements OnInit, AfterViewInit, OnDestroy {
  public reportPeriod = SCROLL_RANGES[0];
  public secondsInADay = 24 * 60 * 60;
  public events: ForwardingHistoryRes = {};
  public filteredEventsBySelectedPeriod: ForwardingEvent[] = [];
  public eventFilterValue = '';
  public errorMessage = '';
  public totalFeeMsat = null;
  public today = new Date(Date.now());
  public timezoneOffset = this.today.getTimezoneOffset() * 60;
  public startDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1, 0, 0, 0);
  public endDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.getMonthDays(this.today.getMonth(), this.today.getFullYear()), 23, 59, 59);
  public feeReportData: any = [];
  public view: any[] = [350, 350];
  public screenPaddingX = 100;
  public gradient = true;
  public xAxisLabel = 'Date';
  public yAxisLabel = 'Fee (Sats)';
  public showYAxisLabel = true;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private dataService: DataService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.showYAxisLabel = !(this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM);
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'GetForwardingHistory') {
          this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
        }
      });
      this.events = (rtlStore.forwardingHistory && rtlStore.forwardingHistory.forwarding_events) ? rtlStore.forwardingHistory : {};
      this.filterForwardingEvents(this.startDate, this.endDate);
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    const CONTAINER_SIZE = this.commonService.getContainerSize();
    switch (this.screenSize) {
      case ScreenSizeEnum.MD:
        this.screenPaddingX = CONTAINER_SIZE.width/10;
        break;

      case ScreenSizeEnum.LG:
        this.screenPaddingX = CONTAINER_SIZE.width/16;
        break;

      default:
        this.screenPaddingX = CONTAINER_SIZE.width/20;
        break;
    }
    this.view = [CONTAINER_SIZE.width - this.screenPaddingX, CONTAINER_SIZE.height/2.2];
  }

  filterForwardingEvents(start: Date, end: Date) {
    const startDateInSeconds = (Math.round(start.getTime()/1000) - this.timezoneOffset);
    const endDateInSeconds = (Math.round(end.getTime()/1000) - this.timezoneOffset);
    this.filteredEventsBySelectedPeriod = [];
    this.feeReportData = [];
    this.totalFeeMsat = null;
    if (this.events && this.events.forwarding_events  && this.events.forwarding_events.length > 0) {
      this.events.forwarding_events.forEach(event => {
        if (event.status === 'settled' && event.received_time >= startDateInSeconds && event.received_time < endDateInSeconds) {
          this.filteredEventsBySelectedPeriod.push(event);
        }
      });
      this.feeReportData = this.prepareFeeReport(start);
    }
  }

  @HostListener('mouseup', ['$event']) onChartMouseUp(e) {
    if (e.srcElement.tagName === 'svg' && e.srcElement.classList.length > 0 && e.srcElement.classList[0] === 'ngx-charts') {
      this.eventFilterValue = '';
    }
  }
  
  onChartBarSelected(event) {
    if(this.reportPeriod === SCROLL_RANGES[1]) {
      this.eventFilterValue = event.name.toUpperCase() + '/' + this.startDate.getFullYear();
    } else {
      this.eventFilterValue = event.name.toString().padStart(2, '0') + '/' + MONTHS[this.startDate.getMonth()].name.toUpperCase() + '/' + this.startDate.getFullYear();
    }
  }

  prepareFeeReport(start: Date) {
    const startDateInSeconds = Math.round(start.getTime()/1000) - this.timezoneOffset;
    let feeReport = [];
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      for (let i = 0; i < 12; i++) {
        feeReport.push({name: MONTHS[i].name, value: 0.000000001, extra: {totalEvents: 0}});
      }
      this.filteredEventsBySelectedPeriod.map(event => {
        let monthNumber = new Date((+event.received_time + this.timezoneOffset)*1000).getMonth();
        feeReport[monthNumber].value = feeReport[monthNumber].value + (+event.fee / 1000);
        feeReport[monthNumber].extra.totalEvents = feeReport[monthNumber].extra.totalEvents + 1;
        this.totalFeeMsat = (this.totalFeeMsat ? this.totalFeeMsat : 0) + +event.fee;
      });
    } else {
      for (let i = 0; i < this.getMonthDays(start.getMonth(), start.getFullYear()); i++) {
        feeReport.push({name: i + 1, value: 0.000000001, extra: {totalEvents: 0}});
      }
      this.filteredEventsBySelectedPeriod.map(event => {
        let dateNumber = Math.floor((+event.received_time - startDateInSeconds) / this.secondsInADay);
        feeReport[dateNumber].value = feeReport[dateNumber].value + (+event.fee / 1000);
        feeReport[dateNumber].extra.totalEvents = feeReport[dateNumber].extra.totalEvents + 1;
        this.totalFeeMsat = (this.totalFeeMsat ? this.totalFeeMsat : 0) + +event.fee;
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
    this.filterForwardingEvents(this.startDate, this.endDate);
    this.eventFilterValue = '';
  }

  getMonthDays(selMonth: number, selYear: number) {
    return (selMonth === 1 && selYear%4 === 0) ? (MONTHS[selMonth].days+1) : MONTHS[selMonth].days;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

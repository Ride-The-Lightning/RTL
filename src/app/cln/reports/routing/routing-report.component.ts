import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ForwardingEvent, ListForwards } from '../../../shared/models/clnModels';
import { APICallStatusEnum, CLNForwardingEventsStatusEnum, MONTHS, ReportBy, ScreenSizeEnum, SCROLL_RANGES } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { fadeIn } from '../../../shared/animation/opacity-animation';

import { RTLState } from '../../../store/rtl.state';
import { forwardingHistory } from '../../store/cln.selector';
import { getForwardingHistory } from '../../store/cln.actions';
import { DataService } from '../../../shared/services/data.service';

@Component({
  selector: 'rtl-cln-routing-report',
  templateUrl: './routing-report.component.html',
  styleUrls: ['./routing-report.component.scss'],
  animations: [fadeIn]
})
export class CLNRoutingReportComponent implements OnInit, OnDestroy {

  public reportPeriod = SCROLL_RANGES[0];
  public secondsInADay = 24 * 60 * 60;
  public events: ForwardingEvent[] = [];
  public filteredEventsBySelectedPeriod: ForwardingEvent[] = [];
  public eventFilterValue = '';
  public reportBy = ReportBy;
  public selReportBy = ReportBy.FEES;
  public totalFeeMsat: number | null = null;
  public today = new Date(Date.now());
  public startDate = new Date(this.today.getFullYear(), this.today.getMonth(), 1, 0, 0, 0);
  public endDate = new Date(this.today.getFullYear(), this.today.getMonth(), this.getMonthDays(this.today.getMonth(), this.today.getFullYear()), 23, 59, 59);
  public routingReportData: any = [];
  public view: [number, number] = [350, 350];
  public screenPaddingX = 100;
  public gradient = true;
  public xAxisLabel = 'Date';
  public yAxisLabel = 'Fee (Sats)';
  public showYAxisLabel = true;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private dataService: DataService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.showYAxisLabel = !(this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM);
    this.store.pipe(take(1)).subscribe((state) => {
      if (state.cln.apisCallStatus.FetchForwardingHistoryS.status === APICallStatusEnum.UN_INITIATED && !state.cln.forwardingHistory.listForwards?.length) {
        this.store.dispatch(getForwardingHistory({ payload: { status: CLNForwardingEventsStatusEnum.SETTLED } }));
      }
    });
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[0])).
      subscribe((fhSeletor: { forwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }) => {
        if (fhSeletor.forwardingHistory.status === CLNForwardingEventsStatusEnum.SETTLED) {
          this.errorMessage = '';
          this.apiCallStatus = fhSeletor.apiCallStatus;
          if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
            this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
          } else if (this.apiCallStatus.status === APICallStatusEnum.COMPLETED) {
            this.events = fhSeletor.forwardingHistory.listForwards || [];
            this.filterForwardingEvents(this.startDate, this.endDate);
          }
          this.logger.info(fhSeletor);
        }
      });
    this.commonService.containerSizeUpdated.pipe(takeUntil(this.unSubs[1])).subscribe((CONTAINER_SIZE) => {
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
      this.logger.info('Container Size: ' + JSON.stringify(CONTAINER_SIZE));
      this.logger.info('View: ' + JSON.stringify(this.view));
    });
  }

  filterForwardingEvents(start: Date, end: Date) {
    const startDateInSeconds = Math.round(start.getTime() / 1000);
    const endDateInSeconds = Math.round(end.getTime() / 1000);
    this.filteredEventsBySelectedPeriod = [];
    this.routingReportData = [];
    this.totalFeeMsat = null;
    if (this.events && this.events.length > 0) {
      this.events.forEach((event) => {
        if (event.received_time && event.received_time >= startDateInSeconds && event.received_time < endDateInSeconds) {
          this.filteredEventsBySelectedPeriod.push(event);
        }
      });
      this.routingReportData = this.selReportBy === this.reportBy.EVENTS ? this.prepareEventsReport(start) : this.prepareFeeReport(start);
    }
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
    const feeReport: any[] = [];
    this.totalFeeMsat = 0;
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      for (let i = 0; i < 12; i++) {
        feeReport.push({ name: MONTHS[i].name, value: 0.0, extra: { totalEvents: 0 } });
      }
      this.filteredEventsBySelectedPeriod?.map((event) => {
        const monthNumber = event.received_time ? new Date((+event.received_time) * 1000).getMonth() : 12;
        feeReport[monthNumber].value = event.fee ? feeReport[monthNumber].value + (+event.fee / 1000) : feeReport[monthNumber].value;
        feeReport[monthNumber].extra.totalEvents = feeReport[monthNumber].extra.totalEvents + 1;
        this.totalFeeMsat = event.fee ? (this.totalFeeMsat ? this.totalFeeMsat : 0) + +event.fee : this.totalFeeMsat;
        return this.filteredEventsBySelectedPeriod;
      });
    } else {
      for (let i = 0; i < this.getMonthDays(start.getMonth(), start.getFullYear()); i++) {
        feeReport.push({ name: i + 1, value: 0.0, extra: { totalEvents: 0 } });
      }
      this.filteredEventsBySelectedPeriod?.map((event) => {
        const dateNumber = event.received_time ? Math.floor((+event.received_time - startDateInSeconds) / this.secondsInADay) : 0;
        feeReport[dateNumber].value = event.fee ? feeReport[dateNumber].value + (+event.fee / 1000) : feeReport[dateNumber].value;
        feeReport[dateNumber].extra.totalEvents = feeReport[dateNumber].extra.totalEvents + 1;
        this.totalFeeMsat = event.fee ? (this.totalFeeMsat ? this.totalFeeMsat : 0) + +event.fee : this.totalFeeMsat;
        return this.filteredEventsBySelectedPeriod;
      });
    }
    return feeReport;
  }

  prepareEventsReport(start: Date) {
    const startDateInSeconds = Math.round(start.getTime() / 1000);
    const eventsReport: any[] = [];
    this.totalFeeMsat = 0;
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      for (let i = 0; i < 12; i++) {
        eventsReport.push({ name: MONTHS[i].name, value: 0, extra: { totalFees: 0.0 } });
      }
      this.filteredEventsBySelectedPeriod?.map((event) => {
        const monthNumber = event.received_time ? new Date((+event.received_time) * 1000).getMonth() : 12;
        eventsReport[monthNumber].value = eventsReport[monthNumber].value + 1;
        eventsReport[monthNumber].extra.totalFees = event.fee ? eventsReport[monthNumber].extra.totalFees + (+event.fee / 1000) : eventsReport[monthNumber].extra.totalFees;
        this.totalFeeMsat = event.fee ? (this.totalFeeMsat ? this.totalFeeMsat : 0) + +event.fee : this.totalFeeMsat;
        return this.filteredEventsBySelectedPeriod;
      });
    } else {
      for (let i = 0; i < this.getMonthDays(start.getMonth(), start.getFullYear()); i++) {
        eventsReport.push({ name: i + 1, value: 0, extra: { totalFees: 0.0 } });
      }
      this.filteredEventsBySelectedPeriod?.map((event) => {
        const dateNumber = event.received_time ? Math.floor((+event.received_time - startDateInSeconds) / this.secondsInADay) : 0;
        eventsReport[dateNumber].value = eventsReport[dateNumber].value + 1;
        eventsReport[dateNumber].extra.totalFees = event.fee ? eventsReport[dateNumber].extra.totalFees + (+event.fee / 1000) : eventsReport[dateNumber].extra.totalFees;
        this.totalFeeMsat = event.fee ? (this.totalFeeMsat ? this.totalFeeMsat : 0) + +event.fee : this.totalFeeMsat;
        return this.filteredEventsBySelectedPeriod;
      });
    }
    return eventsReport;
  }

  onSelectionChange(selectedValues: { selDate: Date, selScrollRange: string }) {
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
    return (selMonth === 1 && selYear % 4 === 0) ? (MONTHS[selMonth].days + 1) : MONTHS[selMonth].days;
  }

  onSelReportByChange() {
    this.yAxisLabel = this.selReportBy === this.reportBy.EVENTS ? 'Events' : 'Fee (Sats)';
    this.routingReportData = this.selReportBy === this.reportBy.EVENTS ? this.prepareEventsReport(this.startDate) : this.prepareFeeReport(this.startDate);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

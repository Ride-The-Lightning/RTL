import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { PaymentRelayed, Payments } from '../../../shared/models/eclModels';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { MONTHS, ScreenSizeEnum, SCROLL_RANGES } from '../../../shared/services/consts-enums-functions';
import { fadeIn } from '../../../shared/animation/opacity-animation';

import { RTLState } from '../../../store/rtl.state';
import { payments } from '../../store/ecl.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-ecl-fee-report',
  templateUrl: './fee-report.component.html',
  styleUrls: ['./fee-report.component.scss'],
  animations: [fadeIn]
})
export class ECLFeeReportComponent implements OnInit, OnDestroy {

  public reportPeriod = SCROLL_RANGES[0];
  public secondsInADay = 24 * 60 * 60;
  public events: PaymentRelayed[] = [];
  public filteredEventsBySelectedPeriod: PaymentRelayed[] = [];
  public eventFilterValue = '';
  public totalFeeSat = null;
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
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.showYAxisLabel = !(this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM);
    this.store.select(payments).pipe(takeUntil(this.unSubs[0])).
      subscribe((paymentsSelector: { payments: Payments, apiCallStatus: ApiCallStatusPayload }) => {
        this.events = paymentsSelector.payments && paymentsSelector.payments.relayed ? paymentsSelector.payments.relayed : [];
        this.filterForwardingEvents(this.startDate, this.endDate);
        this.logger.info(paymentsSelector);
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
    this.logger.info('Filtering Forwarding Events Starting at ' + new Date(Date.now()).toLocaleString() + ' From ' + start.toLocaleString() + ' To ' + end.toLocaleString());
    this.filteredEventsBySelectedPeriod = [];
    this.feeReportData = [];
    this.totalFeeSat = null;
    if (this.events && this.events.length > 0) {
      this.events.forEach((event) => {
        if (Math.floor(event.timestamp / 1000) >= startDateInSeconds && Math.floor(event.timestamp / 1000) < endDateInSeconds) {
          this.filteredEventsBySelectedPeriod.push(event);
        }
      });
      this.feeReportData = this.prepareFeeReport(start);
    }
    this.logger.info('Filtering Forwarding Events Finished at ' + new Date(Date.now()).toLocaleString());
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
    this.logger.info('Fee Report Prepare Starting at ' + new Date(Date.now()).toLocaleString() + ' From ' + start.toLocaleString());
    if (this.reportPeriod === SCROLL_RANGES[1]) {
      for (let i = 0; i < 12; i++) {
        feeReport.push({ name: MONTHS[i].name, value: 0.0, extra: { totalEvents: 0 } });
      }
      this.filteredEventsBySelectedPeriod.map((event) => {
        const monthNumber = new Date(event.timestamp).getMonth();
        feeReport[monthNumber].value = feeReport[monthNumber].value + (event.amountIn - event.amountOut);
        feeReport[monthNumber].extra.totalEvents = feeReport[monthNumber].extra.totalEvents + 1;
        this.totalFeeSat = (this.totalFeeSat ? this.totalFeeSat : 0) + (event.amountIn - event.amountOut);
        return this.filteredEventsBySelectedPeriod;
      });
    } else {
      for (let i = 0; i < this.getMonthDays(start.getMonth(), start.getFullYear()); i++) {
        feeReport.push({ name: i + 1, value: 0.0, extra: { totalEvents: 0 } });
      }
      this.filteredEventsBySelectedPeriod.map((event) => {
        const dateNumber = Math.floor((Math.floor(event.timestamp / 1000) - startDateInSeconds) / this.secondsInADay);
        feeReport[dateNumber].value = feeReport[dateNumber].value + (event.amountIn - event.amountOut);
        feeReport[dateNumber].extra.totalEvents = feeReport[dateNumber].extra.totalEvents + 1;
        this.totalFeeSat = (this.totalFeeSat ? this.totalFeeSat : 0) + (event.amountIn - event.amountOut);
        return this.filteredEventsBySelectedPeriod;
      });
    }
    this.logger.info('Fee Report Prepare Finished at ' + new Date(Date.now()).toLocaleString());
    return feeReport;
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

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

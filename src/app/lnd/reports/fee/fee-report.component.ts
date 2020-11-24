import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SwitchRes } from '../../../shared/models/lndModels';
import { CommonService } from '../../../shared/services/common.service';
import { MONTHS, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { DataService } from '../../../shared/services/data.service';
import { fadeIn } from '../../../shared/animation/opacity-animation';

import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-fee-report',
  templateUrl: './fee-report.component.html',
  styleUrls: ['./fee-report.component.scss'],
  animations: [fadeIn]
})
export class FeeReportComponent implements OnInit, OnDestroy {
  public secondsInADay = 24 * 60 * 60;
  public events: SwitchRes = {};
  public eventFilterValue = '';
  public endDate = new Date(Date.now());
  public startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), 1, 0, 0, 0);
  public feeReportData: any = [];
  public view: any[] = [700, 350];
  public gradient = true;
  public xAxisLabel = 'Date';
  public yAxisLabel = 'Fee (Sats)';
  public xAxisShow = true;
  public yAxisShow = true;
  public showXAxisLabel = true;
  public showYAxisLabel = true;
  public screenSize = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private dataService: DataService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    switch (this.screenSize) {
      case ScreenSizeEnum.XS:
        this.view = [320, 350];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = false;
        break;
    
      case ScreenSizeEnum.SM:
        this.view = [500, 350];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = false;
        break;

      case ScreenSizeEnum.MD:
        this.view = [800, 350];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = true;
        break;

      case ScreenSizeEnum.LG:
        this.view = [1200, 350];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = true;
        break;
  
      default:
        this.view = [900, 350];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = true;
        break;
    }
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      if(rtlStore.initialAPIResponseStatus[0] === 'COMPLETE') {
        this.fetchEvents(this.startDate, this.endDate);
      }
    });
  }

  fetchEvents(start: Date, end: Date) {
    const startDateInSeconds = (Math.round(start.getTime()/1000) - (start.getTimezoneOffset() * 60)).toString();
    const endDateInSeconds = (Math.round(end.getTime()/1000) - (end.getTimezoneOffset() * 60)).toString();
    this.dataService.getForwardingHistory(startDateInSeconds, endDateInSeconds)
    .pipe(takeUntil(this.unSubs[1])).subscribe(res => { 
      if (res.forwarding_events && res.forwarding_events.length) {
        res.forwarding_events = res.forwarding_events.reverse();
        this.events = res;
        this.feeReportData = this.prepareFeeReport(start);
      } else {
        this.events = {};
        this.feeReportData = [];
      }
    });    
  }

  @HostListener('mouseup', ['$event']) onChartMouseUp(e) {
    if (e.srcElement.toString() === '[object SVGSVGElement]') {
      this.eventFilterValue = '';
      Object.assign(this, this.eventFilterValue);
    }
  }
  
  onChartBarSelected(event) {
    this.eventFilterValue = event.name.toString().padStart(2, '0') + '/' + MONTHS[this.startDate.getMonth()].name + '/' + this.startDate.getFullYear();
    Object.assign(this, this.eventFilterValue);
  }

  prepareFeeReport(start: Date) {
    const startDateInSeconds = Math.round(start.getTime()/1000) - (start.getTimezoneOffset() * 60);
    let feeReport = [];
    for (let i = 0; i < this.getMonthDays(start.getMonth(), start.getFullYear()); i++) {
      feeReport.push({name: i + 1, value: 0});
    }
    this.events.forwarding_events.map(event => {
      let dateNumber = Math.floor((+event.timestamp - startDateInSeconds) / this.secondsInADay);
      feeReport[dateNumber].value = feeReport[dateNumber].value + (+event.fee_msat / 1000);
      this.events.total_fee_msat = (this.events.total_fee_msat ? this.events.total_fee_msat : 0) + +event.fee_msat;
    });
    return feeReport;
  }

  onSelectionChange(event: {value: Date, animationDirection: string}) {
    const selMonth = event.value.getMonth();
    const selYear = event.value.getFullYear();
    this.startDate = new Date(selYear, selMonth, 1, 0, 0, 0);
    this.endDate = new Date(selYear, selMonth, this.getMonthDays(selMonth, selYear), 23, 59, 59);
    this.fetchEvents(this.startDate, this.endDate);
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

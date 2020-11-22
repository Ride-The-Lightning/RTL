import { Component, OnInit, OnDestroy } from '@angular/core';
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
  public view: any[] = [700, 400];
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
        this.view = [320, 400];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = false;
        break;
    
      case ScreenSizeEnum.SM:
        this.view = [500, 400];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = false;
        break;

      case ScreenSizeEnum.MD:
        this.view = [800, 400];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = true;
        break;

      case ScreenSizeEnum.LG:
        this.view = [1200, 400];
        this.xAxisShow = true;
        this.yAxisShow = true;
        this.showXAxisLabel = true;
        this.showYAxisLabel = true;
        break;
  
      default:
        this.view = [900, 400];
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
    this.dataService.getForwardingHistory(Math.round(start.getTime() / 1000).toString(), Math.round(end.getTime() / 1000).toString())
    .pipe(takeUntil(this.unSubs[1])).subscribe(res => { 
      if (res.forwarding_events && res.forwarding_events.length) {
        res.forwarding_events = res.forwarding_events.reverse();
        this.events = res;
        this.feeReportData = this.prepareFeeReport(start);
      }
    });    
  }

  onDateSelected(event) {
    this.eventFilterValue = event.name.toString().padStart(2, '0') + '/' + MONTHS[this.startDate.getMonth()] + '/' + this.startDate.getFullYear();
    Object.assign(this, this.eventFilterValue);
  }

  prepareFeeReport(start: Date) {
    const startDateInSeconds = Math.round(start.getTime()/1000) - (start.getTimezoneOffset() * 60);
    return this.events.forwarding_events.reduce((feeReport, event) => {
      let dateNumber = Math.floor((+event.timestamp - startDateInSeconds) / this.secondsInADay) + 1;
      let indexDateExist = feeReport.findIndex(e => e.name === dateNumber);
      if (indexDateExist > -1) {
        feeReport[indexDateExist].value = feeReport[indexDateExist].value + (+event.fee_msat / 1000);
      } else {
        feeReport.push({
          name: dateNumber,
          value: +event.fee_msat / 1000
        });
      }
      this.events.total_fee_msat = (this.events.total_fee_msat ? this.events.total_fee_msat : 0) + +event.fee_msat;
      return feeReport;
    }, []);
  }

  onSelectionChange(event: {value: Date, animationDirection: string}) {
    this.startDate = new Date(event.value.getFullYear(), event.value.getMonth(), 1, 0, 0, 0);
    this.endDate = new Date(event.value.getFullYear(), event.value.getMonth() + 1, 0, 23, 59, 59);
    this.fetchEvents(this.startDate, this.endDate);
    this.eventFilterValue = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

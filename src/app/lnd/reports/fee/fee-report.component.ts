import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SwitchRes } from '../../../shared/models/lndModels';
import { CommonService } from '../../../shared/services/common.service';
import { ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { DataService } from '../../../shared/services/data.service';

@Component({
  selector: 'rtl-fee-report',
  templateUrl: './fee-report.component.html',
  styleUrls: ['./fee-report.component.scss']
})
export class FeeReportComponent implements OnInit, OnDestroy {
  public lastOffsetIndex = 0;
  public events: SwitchRes = {};
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
  public flgLoading: Array<Boolean | 'error'> = [true];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private dataService: DataService, private commonService: CommonService) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    switch (this.screenSize) {
      case ScreenSizeEnum.XS:
        this.view = [320, 400];
        this.xAxisShow = false;
        this.yAxisShow = false;
        this.showXAxisLabel = false;
        this.showYAxisLabel = false;
        break;
    
      case ScreenSizeEnum.SM:
        this.view = [500, 400];
        this.xAxisShow = false;
        this.yAxisShow = false;
        this.showXAxisLabel = false;
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
    this.fetchEvents(this.startDate, this.endDate);
  }

  onSelect(event) {
    console.warn(event);
  }

  fetchEvents(start: Date, end: Date) {
    this.dataService.getForwardingHistory(Math.round(start.getTime() / 1000).toString(), Math.round(end.getTime() / 1000).toString())
    .pipe(takeUntil(this.unSubs[0])).subscribe(res => { 
      this.events = res;
      this.feeReportData = this.prepareFeeReport(start, end);
    });    
  }

  prepareFeeReport(start: Date, end: Date) {
    const secondsInADay = 24 * 60 * 60;
    const startDateInSeconds = Math.round(start.getTime()/1000);
    let tempReport = this.events.forwarding_events.reduce((feeReport, event) => {
      let dateNumber = Math.floor((+event.timestamp - startDateInSeconds) / secondsInADay) + 1;
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
    tempReport = tempReport.reverse();
    return tempReport;
  }

  onScroll(selectedDate: Date) {
    this.fetchEvents(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0), 
    new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

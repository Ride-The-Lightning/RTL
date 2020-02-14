import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { DataTypeEnum, AlertTypeEnum } from '../../../shared/services/consts-enums-functions';
import { LoopQuote } from '../../../shared/models/loopModels';
import { LoopService } from '../../../shared/services/loop.service';
import { LoggerService } from '../../../shared/services/logger.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';

@Component({
  selector: 'rtl-loop-out',
  templateUrl: './loop-out.component.html',
  styleUrls: ['./loop-out.component.scss']
})
export class LoopOutComponent implements OnInit, OnDestroy {
  private targetConf = 2;
  public outAmount = 250000;
  public quotes: LoopQuote[] = [];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    this.loopService.getLoopOutTermsAndQuotes(this.targetConf)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((response: LoopQuote[]) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.outAmount = response[0] && response[0].amount ? response[0].amount : 250000;
      this.quotes = response;
      this.logger.info(this.quotes);
    });
  }

  onLoopOut() {
    if(this.outAmount < this.quotes[0].amount || this.outAmount > this.quotes[1].amount) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('All Channels Looping Out...'));
    this.loopService.loopOut(this.outAmount, null, 2, 5010, 447, 36, 1337, 350)
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((data: any) => {
      data = JSON.parse(data);
      this.store.dispatch(new RTLActions.CloseSpinner());
      const loopOutStatus = [
        [{key: 'id', value: data.id, title: 'ID', width: 100, type: DataTypeEnum.STRING}],
        [{key: 'htlc_address', value: data.htlc_address, title: 'HTLC address', width: 100, type: DataTypeEnum.STRING}]
      ];
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        type: AlertTypeEnum.INFORMATION,
        alertTitle: 'Successful: Monitor the status on the loop monitor',
        message: loopOutStatus
      }}));
    }, (err) => {
      this.logger.error(err);
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

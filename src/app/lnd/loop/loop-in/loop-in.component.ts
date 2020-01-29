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
  selector: 'rtl-loop-in',
  templateUrl: './loop-in.component.html',
  styleUrls: ['./loop-in.component.scss']
})
export class LoopInComponent implements OnInit, OnDestroy {
  private targetConf = 2;
  public inAmount = 250000;
  public quotes: LoopQuote[] = [];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.loopService.getLoopInTermsAndQuotes(this.targetConf)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((response: LoopQuote[]) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.inAmount = response[0] && response[0].amount ? response[0].amount : 250000;
      this.quotes = response;
      this.logger.info(this.quotes);
    });
  }

  onLoopIn() {
    if(this.inAmount < this.quotes[0].amount || this.inAmount > this.quotes[1].amount) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('All Channels Looping In...'));
    this.loopService.loopIn(this.inAmount, null)
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((data: any) => {
      data = JSON.parse(data);
      this.store.dispatch(new RTLActions.CloseSpinner());
      const loopInStatus = [
        [{key: 'id', value: data.id, title: 'ID', width: 100, type: DataTypeEnum.STRING}],
        [{key: 'htlc_address', value: data.htlc_address, title: 'HTLC address', width: 100, type: DataTypeEnum.STRING}]
      ];
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        type: AlertTypeEnum.INFORMATION,
        alertTitle: 'Successful: Monitor the status on the loop monitor',
        message: loopInStatus
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

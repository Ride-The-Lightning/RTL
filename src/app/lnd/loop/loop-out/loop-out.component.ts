import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoopOutModalComponent } from '../../../shared/components/data-modal/loop-out-modal/loop-out-modal.component';
import { LoopQuote } from '../../../shared/models/loopModels';
import { LoopService } from '../../../shared/services/loop.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';
import { ErrorMessageComponent } from '../../../shared/components/data-modal/error-message/error-message.component';

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

  constructor(private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {}

  onLoopOut() {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    this.loopService.getLoopOutTermsAndQuotes(this.targetConf)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        channel: null,
        minQuote: response[0],
        maxQuote: response[1],
        component: LoopOutModalComponent
      }}));    
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

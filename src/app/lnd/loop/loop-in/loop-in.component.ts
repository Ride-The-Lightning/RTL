import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoopInModalComponent } from '../../../shared/components/data-modal/loop-in-modal/loop-in-modal.component';
import { LoopQuote } from '../../../shared/models/loopModels';
import { LoopService } from '../../../shared/services/loop.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';
import { ErrorMessageComponent } from '../../../shared/components/data-modal/error-message/error-message.component';

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

  constructor(private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {}

  onLoopIn() {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    this.loopService.getLoopInTermsAndQuotes(this.targetConf)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        minQuote: response[0],
        maxQuote: response[1],
        component: LoopInModalComponent
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

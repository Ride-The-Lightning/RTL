import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

import { LoopTypeEnum } from '../../services/consts-enums-functions';
import { SwapModalComponent } from './swap-modal/swap-modal.component';
import { BoltzQuote } from '../../models/boltzModels';
import { BoltzService } from '../../services/boltz.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';

@Component({
  selector: 'rtl-boltz-root',
  templateUrl: './boltz-root.component.html',
  styleUrls: ['./boltz-root.component.scss']
})
export class BoltzRootComponent implements OnInit {
  public faInfinity = faInfinity;
  private targetConf = 2;
  public inAmount = 250000;
  public quotes: BoltzQuote[] = [];
  public LoopTypeEnum = LoopTypeEnum;
  public selectedSwapType: LoopTypeEnum = LoopTypeEnum.LOOP_OUT;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private boltzService: BoltzService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {}

  onSelectedIndexChange(event: any) {
    if(event === 1) {
      this.selectedSwapType = LoopTypeEnum.LOOP_IN;
    } else {
      this.selectedSwapType = LoopTypeEnum.LOOP_OUT;
    }
  }

  onLoop(direction: LoopTypeEnum) {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    if(direction === LoopTypeEnum.LOOP_IN) {
      this.boltzService.getLoopInTermsAndQuotes(this.targetConf)
      .pipe(takeUntil(this.unSubs[0]))
      .subscribe(response => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new RTLActions.OpenAlert({data: {
          minQuote: response[0],
          maxQuote: response[1],
          direction: direction,
          component: SwapModalComponent
        }}));    
      });
    } else {
      this.boltzService.getLoopOutTermsAndQuotes(this.targetConf)
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe(response => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.store.dispatch(new RTLActions.OpenAlert({data: {
          minQuote: response[0],
          maxQuote: response[1],
          direction: direction,
          component: SwapModalComponent
        }}));    
      });
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
  
}

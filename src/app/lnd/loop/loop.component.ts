import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

import { SwapTypeEnum } from '../../shared/services/consts-enums-functions';
import { LoopModalComponent } from './loop-modal/loop-modal.component';
import { LoopQuote } from '../../shared/models/loopModels';
import { LoopService } from '../../shared/services/loop.service';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';

@Component({
  selector: 'rtl-loop',
  templateUrl: './loop.component.html',
  styleUrls: ['./loop.component.scss']
})
export class LoopComponent implements OnInit {
  public faInfinity = faInfinity;
  public inAmount = 250000;
  public quotes: LoopQuote[] = [];
  public swapTypeEnum = SwapTypeEnum;
  public selectedSwapType: SwapTypeEnum = SwapTypeEnum.WITHDRAWAL;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {}

  onSelectedIndexChange(event: any) {
    if(event === 1) {
      this.selectedSwapType = SwapTypeEnum.DEPOSIT;
    } else {
      this.selectedSwapType = SwapTypeEnum.WITHDRAWAL;
    }
  }

  onLoop(direction: SwapTypeEnum) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      direction: direction,
      component: LoopModalComponent
    }}));
  }

  // TODO: Check if destrying is needed if usage in component in removed
  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
  
}

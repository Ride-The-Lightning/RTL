import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faInfinity } from '@fortawesome/free-solid-svg-icons';

import { SwapTypeEnum } from '../../shared/services/consts-enums-functions';
import { BoltzModalComponent } from './boltz-modal/boltz-modal.component';
import { LoopQuote } from '../../shared/models/loopModels';
import { BoltzService } from '../../shared/services/boltz.service';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';

@Component({
  selector: 'rtl-boltz',
  templateUrl: './boltz.component.html',
  styleUrls: ['./boltz.component.scss']
})
export class BoltzComponent implements OnInit {
  public faInfinity = faInfinity;
  public inAmount = 250000;
  public quotes: LoopQuote[] = [];
  public swapTypeEnum = SwapTypeEnum;
  public selectedSwapType: SwapTypeEnum = SwapTypeEnum.WITHDRAWAL;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private boltzService: BoltzService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {}

  onSelectedIndexChange(event: any) {
    if(event === 1) {
      this.selectedSwapType = SwapTypeEnum.DEPOSIT;
    } else {
      this.selectedSwapType = SwapTypeEnum.WITHDRAWAL;
    }
  }

  onLoop(direction: SwapTypeEnum) {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Pairs...'));
    this.boltzService.getPairs()
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(response => {
      const pairs = response['pairs']["BTC/BTC"];
      const lndNode = this.boltzService.getLNDNode();
      this.store.dispatch(new RTLActions.CloseSpinner());
      const minQuote = {
        swap_fee_sat: (pairs.limits.minimal * pairs.fees.percentage * 0.01).toString(),
        htlc_publish_fee_sat: pairs.fees.minerFees.baseAsset.normal.toString(),
        swap_payment_dest: lndNode,
        amount: pairs.limits.minimal
      };
      const maxQuote = {
        swap_fee_sat: (pairs.limits.maximal * pairs.fees.percentage * 0.01).toString(),
        htlc_publish_fee_sat: pairs.fees.minerFees.baseAsset.normal.toString(),
        swap_payment_dest: lndNode,
        amount: pairs.limits.maximal
      };
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        minQuote,
        maxQuote,
        direction: direction,
        component: BoltzModalComponent
      }}));
    })
  }

  // TODO: Check if destrying is needed if usage in component in removed
  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
  
}

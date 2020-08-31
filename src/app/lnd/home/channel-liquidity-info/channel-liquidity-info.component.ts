import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { SwapTypeEnum } from '../../../shared/services/consts-enums-functions';
import { Channel } from '../../../shared/models/lndModels';
import { LoopModalComponent } from '../../loop/loop-modal/loop-modal.component';
import { BoltzModalComponent } from '../../boltz/boltz-modal/boltz-modal.component';
import { LoopService } from '../../../shared/services/loop.service';
import { BoltzService } from '../../../shared/services/boltz.service';


import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';

@Component({
  selector: 'rtl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class ChannelLiquidityInfoComponent implements OnInit, OnDestroy {
  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: Channel[];
  public showLoop: boolean;
  private targetConf = 6;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router, private loopService: LoopService, private boltzService: BoltzService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.showLoop = (rtlStore.nodeSettings.swapServerUrl && rtlStore.nodeSettings.swapServerUrl.trim() !== '') ? true : false;
    });
  }

  goToChannels() {
    this.router.navigateByUrl('/lnd/peerschannels');
  }

  onLoopOut(channel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    this.loopService.getLoopOutTermsAndQuotes(this.targetConf)
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({ minHeight: '56rem', data: {
        channel: channel,
        minQuote: response[0],
        maxQuote: response[1],
        direction: SwapTypeEnum.LOOP_OUT,
        component: LoopModalComponent
      }}));    
    });
  }  

  onSubmarine(channel: Channel) {
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
        channel,
        minQuote,
        maxQuote,
        direction: SwapTypeEnum.WITHDRAWAL,
        component: BoltzModalComponent
      }}));
    })
  }  

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

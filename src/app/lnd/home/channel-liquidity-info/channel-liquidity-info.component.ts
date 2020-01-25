import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Channel } from '../../../shared/models/lndModels';
import { LoopService } from '../../../shared/services/loop.service';

import { RTLEffects } from '../../../store/rtl.effects';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import * as RTLActions from '../../../store/rtl.actions';
import { LoopOutComponent } from '../../../shared/components/data-modal/loop-out/loop-out.component';

@Component({
  selector: 'rtl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class ChannelLiquidityInfoComponent implements OnInit, OnDestroy {
  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: Channel[];
  private targetConf = 2;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router, private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) {}

  ngOnInit() {}

  goToChannels() {
    this.router.navigateByUrl('/lnd/peerschannels');
  }

  onLoopOut(channel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms and Quotes...'));
    this.loopService.getLoopOutTermsAndQuotes(this.targetConf)
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        channelId: channel.chan_id,
        outQuote1: response[0],
        outQuote2: response[1],
        component: LoopOutComponent
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

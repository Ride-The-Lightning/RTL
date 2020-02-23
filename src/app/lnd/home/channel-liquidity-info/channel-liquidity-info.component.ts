import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

import { Channel } from '../../../shared/models/lndModels';
import { LoopOutModalComponent } from '../../../shared/components/data-modal/loop/loop-out-modal/loop-out-modal.component';
import { LoopService } from '../../../shared/services/loop.service';

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
  public faCircleNotch = faCircleNotch;
  private targetConf = 6;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router, private loopService: LoopService, private store: Store<fromRTLReducer.RTLState>) {}

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
      this.store.dispatch(new RTLActions.OpenAlert({ minHeight: '52rem', data: {
        channel: channel,
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

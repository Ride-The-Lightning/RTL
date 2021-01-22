import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ScreenSizeEnum, LoopTypeEnum } from '../../../shared/services/consts-enums-functions';
import { Channel } from '../../../shared/models/lndModels';
import { LoopModalComponent } from '../../../shared/components/services/loop/loop-modal/loop-modal.component';
import { LoopService } from '../../../shared/services/loop.service';
import { CommonService } from '../../../shared/services/common.service';

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
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router, private loopService: LoopService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.showLoop = (rtlStore.nodeSettings.swapServerUrl && rtlStore.nodeSettings.swapServerUrl.trim() !== '') ? true : false;
    });
  }

  goToChannels() {
    this.router.navigateByUrl('/lnd/connections');
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
        direction: LoopTypeEnum.LOOP_OUT,
        component: LoopModalComponent
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

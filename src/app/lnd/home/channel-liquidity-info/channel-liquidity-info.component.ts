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

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { lndNodeSettings } from '../../store/lnd.selector';

@Component({
  selector: 'rtl-channel-liquidity-info',
  templateUrl: './channel-liquidity-info.component.html',
  styleUrls: ['./channel-liquidity-info.component.scss']
})
export class ChannelLiquidityInfoComponent implements OnInit, OnDestroy {

  @Input() direction: string;
  @Input() totalLiquidity: number;
  @Input() allChannels: Channel[];
  @Input() errorMessage: string;
  public showLoop: boolean;
  private targetConf = 6;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private router: Router, private loopService: LoopService, private commonService: CommonService, private store: Store<RTLState>) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild | null) => {
      this.showLoop = !!((nodeSettings?.swapServerUrl && nodeSettings.swapServerUrl.trim() !== ''));
    });
  }

  goToChannels() {
    this.router.navigateByUrl('/lnd/connections');
  }

  onLoopOut(channel: Channel) {
    this.loopService.getLoopOutTermsAndQuotes(this.targetConf).
      pipe(takeUntil(this.unSubs[1])).
      subscribe((response) => {
        this.store.dispatch(openAlert({
          payload: {
            minHeight: '56rem', data: {
              channel: channel,
              minQuote: response[0],
              maxQuote: response[1],
              direction: LoopTypeEnum.LOOP_OUT,
              component: LoopModalComponent
            }
          }
        }));
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

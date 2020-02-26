import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { OpenChannelComponent } from '../open-channel-modal/open-channel.component';
import { Peer, GetInfo } from '../../../../shared/models/lndModels';
import { ScreenSizeEnum } from '../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../shared/services/logger.service';
import { CommonService } from '../../../../shared/services/common.service';

import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-manage',
  templateUrl: './channel-manage.component.html',
  styleUrls: ['./channel-manage.component.scss']
})
export class ChannelManageComponent implements OnInit, OnDestroy {
  public totalBalance = 0;
  public peers: Peer[] = [];
  public information: GetInfo = {};
  public myChanPolicy: any = {};
  public screenSizeEnum = ScreenSizeEnum;
  public screenSize = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.information = rtlStore.information;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (!peer.alias || peer.alias === '') {
          peer.alias = peer.pub_key.substring(0, 15) + '...';
        }
      });
      this.totalBalance = +rtlStore.blockchainBalance.total_balance || 0;
      this.logger.info(rtlStore);
    });
  }

  onOpenChannel() {
    const peerToAddChannelMessage = {
      peers: this.peers, 
      information: this.information,
      balance: this.totalBalance
    };
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      alertTitle: 'Open Channel',
      message: peerToAddChannelMessage,
      newlyAdded: false,
      component: OpenChannelComponent
    }}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faUsers, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { OpenChannelComponent } from './channels/open-channel-modal/open-channel.component';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { Peer, GetInfo } from '../../shared/models/lndModels';
import { LoggerService } from '../../shared/services/logger.service';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-peers-channels',
  templateUrl: './peers-channels.component.html',
  styleUrls: ['./peers-channels.component.scss']
})
export class PeersChannelsComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public activePeers = 0;
  public activeChannels = 0;
  public faUsers = faUsers;
  public faChartPie = faChartPie;
  public balances = [{title: 'Total Balance', dataValue: 0}, {title: 'Confirmed', dataValue: 0}, {title: 'Unconfirmed', dataValue: 0}];
  public peers: Peer[] = [];
  public information: GetInfo = {};
  public totalBalance = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private logger: LoggerService) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.activePeers = (rtlStore.peers && rtlStore.peers.length) ? rtlStore.peers.length : 0;
      this.activeChannels = rtlStore.numberOfActiveChannels;
      this.balances = [{title: 'Total Balance', dataValue: rtlStore.blockchainBalance.total_balance || 0}, {title: 'Confirmed', dataValue: rtlStore.blockchainBalance.confirmed_balance}, {title: 'Unconfirmed', dataValue: rtlStore.blockchainBalance.unconfirmed_balance}];
      this.information = rtlStore.information;
      this.totalBalance = +rtlStore.blockchainBalance.total_balance;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (!peer.alias || peer.alias === '') {
          peer.alias = peer.pub_key.substring(0, 15) + '...';
        }
      });
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

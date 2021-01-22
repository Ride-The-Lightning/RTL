import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSmile, faFrown } from '@fortawesome/free-regular-svg-icons';
import { faAngleDoubleDown, faAngleDoubleUp, faChartPie, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { UserPersonaEnum, ScreenSizeEnum } from '../../shared/services/consts-enums-functions';
import { ChannelsStatus, GetInfo, Fees, Channel } from '../../shared/models/lndModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import * as LNDActions from '../store/lnd.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

export interface Tile {
  id: string;
  title: string;
  cols: number;
  rows: number;  
  goTo?: string;
  link?: string;
  icon?: any;
}

@Component({
  selector: 'rtl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public faSmile = faSmile;
  public faFrown = faFrown;
  public faAngleDoubleDown = faAngleDoubleDown;
  public faAngleDoubleUp = faAngleDoubleUp;
  public faChartPie = faChartPie;
  public faBolt = faBolt;
  public faServer = faServer;
  public faNetworkWired = faNetworkWired;  
  public flgChildInfoUpdated = false;
  public userPersonaEnum = UserPersonaEnum;
  public activeChannels = 0;
  public inactiveChannels = 0;
  public channelBalances = {localBalance: 0, remoteBalance: 0, balancedness: 0};
  public selNode: SelNodeChild = {};
  public fees: Fees;
  public information: GetInfo = {};
  public balances = { onchain: -1, lightning: -1, total: 0 };
  public allChannels: Channel[] = [];
  public channelsStatus: ChannelsStatus = {};
  public allChannelsCapacity: Channel[] = [];
  public allInboundChannels: Channel[] = [];
  public allOutboundChannels: Channel[] = [];
  public totalInboundLiquidity = 0;
  public totalOutboundLiquidity = 0;
  public operatorCards: Tile[] = [];
  public merchantCards: Tile[] = [];
  public screenSize = '';
  public operatorCardHeight = '330px';
  public merchantCardHeight = '65px';
  public sortField = 'Balance Score';
  public screenSizeEnum = ScreenSizeEnum;
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true, true, true]; // 0: Info, 1: Fee, 2: Wallet, 3: Channel, 4: Network
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private commonService: CommonService, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    switch (this.screenSize) {
      case ScreenSizeEnum.XS:
        this.operatorCards = [
          { id: 'node', icon: this.faServer, title: 'Node Information', cols: 10, rows: 1 },
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 10, rows: 1 },
          { id: 'fee', goTo: 'Routing', link: '/lnd/routing', icon: this.faBolt, title: 'Routing Fee', cols: 10, rows: 1 },
          { id: 'status', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels', cols: 10, rows: 1 },
          { id: 'capacity', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
        ];
        this.merchantCards = [
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 6, rows: 4 },
          { id: 'transactions', goTo: 'Transactions', link: '/lnd/transactions', title: '', cols: 6, rows: 6 },
          { id: 'inboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 6, rows: 8 },
          { id: 'outboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 6, rows: 8 }
        ];
        break;

      case ScreenSizeEnum.SM:
        this.operatorCards = [
          { id: 'node', icon: this.faServer, title: 'Node Information', cols: 5, rows: 1 },
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 5, rows: 1 },
          { id: 'fee', goTo: 'Routing', link: '/lnd/routing', icon: this.faBolt, title: 'Routing Fee', cols: 5, rows: 1 },
          { id: 'status', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels', cols: 5, rows: 1 },
          { id: 'capacity', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
        ];
        this.merchantCards = [
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 3, rows: 4 },
          { id: 'transactions', goTo: 'Transactions', link: '/lnd/transactions', title: '', cols: 3, rows: 4 },
          { id: 'inboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 3, rows: 8 },
          { id: 'outboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 3, rows: 8 }
        ];
        break;
        
      case ScreenSizeEnum.MD:
        this.operatorCards = [
          { id: 'node', icon: this.faServer, title: 'Node Information', cols: 5, rows: 1 },
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 5, rows: 1 },
          { id: 'fee', goTo: 'Routing', link: '/lnd/routing', icon: this.faBolt, title: 'Routing Fee', cols: 5, rows: 1 },
          { id: 'status', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels', cols: 5, rows: 1 },
          { id: 'capacity', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
        ];
        this.merchantCards = [
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 3, rows: 4 },
          { id: 'transactions', goTo: 'Transactions', link: '/lnd/transactions', title: '', cols: 3, rows: 4 },
          { id: 'inboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 3, rows: 8 },
          { id: 'outboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 3, rows: 8 }
        ];
        break;

      default:
        this.operatorCards = [
          { id: 'node', icon: this.faServer, title: 'Node Information', cols: 3, rows: 1 },
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 3, rows: 1 },
          { id: 'capacity', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 4, rows: 2 },
          { id: 'fee', goTo: 'Routing', link: '/lnd/routing', icon: this.faBolt, title: 'Routing Fee', cols: 3, rows: 1 },
          { id: 'status', goTo: 'Channels', link: '/lnd/connections', icon: this.faNetworkWired, title: 'Channels', cols: 3, rows: 1 }
        ];
        this.merchantCards = [
          { id: 'balance', goTo: 'On-Chain', link: '/lnd/onchain', icon: this.faChartPie, title: 'Balances', cols: 2, rows: 5 },
          { id: 'inboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 2, rows: 10 },
          { id: 'outboundLiq', goTo: 'Channels', link: '/lnd/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 2, rows: 10 },
          { id: 'transactions', goTo: 'Transactions', link: '/lnd/transactions', title: '', cols: 2, rows: 5 }
        ];
        break;
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.flgLoading = [true, true, true, true, true, true, true, true];
      rtlStore.effectErrors.forEach(effectsErr => {
        this.flgLoading[0] = (effectsErr.action === 'FetchInfo') ? 'error' : this.flgLoading[0];
        this.flgLoading[1] = (effectsErr.action === 'FetchFees') ? 'error' : this.flgLoading[1];
        this.flgLoading[2] = (effectsErr.action === 'FetchBalance/channels') ? 'error' : this.flgLoading[2];
        this.flgLoading[3] = (effectsErr.action === 'FetchChannels/all') ? 'error' : this.flgLoading[3];
        this.flgLoading[4] = (effectsErr.action === 'FetchChannels/pending') ? 'error' : this.flgLoading[4];
      });
      this.flgLoading[0] = (rtlStore.information.identity_pubkey) ? false : this.flgLoading[0];
      this.flgLoading[1] = (rtlStore.fees.day_fee_sum) ? false : this.flgLoading[1];
      this.flgLoading[2] = (+rtlStore.blockchainBalance.total_balance >= 0 && rtlStore.totalLocalBalance >= 0) ? false : this.flgLoading[2];
      this.flgLoading[3] = (rtlStore.totalLocalBalance >= 0 && rtlStore.totalRemoteBalance >= 0) ? false : this.flgLoading[3];
      this.flgLoading[4] = (this.flgLoading[4] !== 'error' && rtlStore.numberOfPendingChannels) ? false : this.flgLoading[4];
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.fees = rtlStore.fees;
      this.balances.onchain = (+rtlStore.blockchainBalance.total_balance >= 0) ? +rtlStore.blockchainBalance.total_balance : 0;
      let local = (rtlStore.totalLocalBalance) ? +rtlStore.totalLocalBalance : 0;
      let remote = (rtlStore.totalRemoteBalance) ? +rtlStore.totalRemoteBalance : 0;
      let total = local + remote;
      this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local-remote)/total)).toFixed(3) };
      this.balances.lightning = rtlStore.totalLocalBalance;
      this.balances.total = this.balances.lightning + this.balances.onchain;
      this.balances = Object.assign({}, this.balances);
      this.activeChannels =  rtlStore.numberOfActiveChannels;
      this.inactiveChannels = rtlStore.numberOfInactiveChannels;
      this.channelsStatus = {
        active: { channels: rtlStore.numberOfActiveChannels, capacity: rtlStore.totalCapacityActive },
        inactive: { channels: rtlStore.numberOfInactiveChannels, capacity: rtlStore.totalCapacityInactive },
        pending: { channels:  rtlStore.numberOfPendingChannels.open.num_channels, capacity: rtlStore.numberOfPendingChannels.open.limbo_balance },
        closing: { 
          channels: rtlStore.numberOfPendingChannels.closing.num_channels + rtlStore.numberOfPendingChannels.force_closing.num_channels + rtlStore.numberOfPendingChannels.waiting_close.num_channels,
          capacity: rtlStore.numberOfPendingChannels.total_limbo_balance
        }
      };
      this.totalInboundLiquidity = 0;
      this.totalOutboundLiquidity = 0;
      this.allChannels = rtlStore.allChannels.filter(channel => channel.active === true);
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels, 'balancedness')));
      this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels.filter(channel => channel.remote_balance > 0), 'remote_balance')));
      this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels.filter(channel => channel.local_balance > 0), 'local_balance')));
      this.allChannels.forEach(channel => {
        this.totalInboundLiquidity = this.totalInboundLiquidity + +channel.remote_balance;
        this.totalOutboundLiquidity = this.totalOutboundLiquidity + +channel.local_balance;
      });
      if (this.balances.lightning >= 0 && this.balances.onchain >= 0 && this.fees.month_fee_sum >= 0) {
        this.flgChildInfoUpdated = true;
      } else {
        this.flgChildInfoUpdated = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[2]),
    filter((action) => action.type === LNDActions.FETCH_FEES_LND || action.type === LNDActions.SET_FEES_LND))
    .subscribe(action => {
      if(action.type === LNDActions.FETCH_FEES_LND) {
        this.flgChildInfoUpdated = false;
      }
      if(action.type === LNDActions.SET_FEES_LND) {
        this.flgChildInfoUpdated = true;
      }
    });
  }

  onNavigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  onsortChannelsBy() {
    if (this.sortField === 'Balance Score') {
      this.sortField =  'Capacity';
      this.allChannelsCapacity = this.allChannels.sort(function (a, b) {
        const x = +a.local_balance + +a.remote_balance;
        const y = +b.local_balance + +b.remote_balance;
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      });
    } else {
      this.sortField =  'Balance Score';
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels, 'balancedness')));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

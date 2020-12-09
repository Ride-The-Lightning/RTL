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
import { ChannelsStatus, GetInfo, Fees, Channel, Balance, FeeRates } from '../../shared/models/clModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import * as CLActions from '../store/cl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class CLHomeComponent implements OnInit, OnDestroy {
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
  public channelBalances = {localBalance: 0, remoteBalance: 0, balancedness: 0};
  public selNode: SelNodeChild = {};
  public fees: Fees;
  public information: GetInfo = {};
  public totalBalance: Balance = {};
  public balances = { onchain: -1, lightning: -1, total: 0 };
  public allChannels: Channel[] = [];
  public channelsStatus: ChannelsStatus = {};
  public allChannelsCapacity: Channel[] = [];
  public allInboundChannels: Channel[] = [];
  public allOutboundChannels: Channel[] = [];
  public totalInboundLiquidity = 0;
  public totalOutboundLiquidity = 0;
  public feeRatesPerKB: FeeRates = {};
  public feeRatesPerKW: FeeRates = {};
  public operatorCards = [];
  public merchantCards = [];
  public screenSize = '';
  public operatorCardHeight = '330px';
  public merchantCardHeight = '65px';
  public sortField = 'Balance Score';
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true, true, true]; // 0: Info, 1: Fee, 2: Wallet, 3: Channel, 4: Network
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private commonService: CommonService, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.operatorCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 10, rows: 1 },
        { id: 'balance', goTo: 'On-Chain', link: '/cl/onchain', icon: this.faChartPie, title: 'Balances', cols: 10, rows: 1 },
        { id: 'fee', goTo: 'Routing', link: '/cl/routing', icon: this.faBolt, title: 'Routing Fee', cols: 10, rows: 1 },
        { id: 'status', goTo: 'Channels', link: '/cl/connections', icon: this.faNetworkWired, title: 'Channels', cols: 10, rows: 1 },
        { id: 'capacity', goTo: 'Channels', link: '/cl/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
      ];
      this.merchantCards = [
        { id: 'balance', goTo: 'On-Chain', link: '/cl/onchain', icon: this.faChartPie, title: 'Balances', cols: 6, rows: 4 },
        { id: 'transactions', goTo: 'Transactions', link: '/cl/transactions', title: '', cols: 6, rows: 4 },
        { id: 'inboundLiq', goTo: 'Channels', link: '/cl/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 6, rows: 8 },
        { id: 'outboundLiq', goTo: 'Channels', link: '/cl/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 6, rows: 8 }
      ];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.operatorCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 5, rows: 1 },
        { id: 'balance', goTo: 'On-Chain', link: '/cl/onchain', icon: this.faChartPie, title: 'Balances', cols: 5, rows: 1 },
        { id: 'fee', goTo: 'Routing', link: '/cl/routing', icon: this.faBolt, title: 'Routing Fee', cols: 5, rows: 1 },
        { id: 'status', goTo: 'Channels', link: '/cl/connections', icon: this.faNetworkWired, title: 'Channels', cols: 5, rows: 1 },
        { id: 'capacity', goTo: 'Channels', link: '/cl/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
      ];
      this.merchantCards = [
        { id: 'balance', goTo: 'On-Chain', link: '/cl/onchain', icon: this.faChartPie, title: 'Balances', cols: 3, rows: 4 },
        { id: 'transactions', goTo: 'Transactions', link: '/cl/transactions', title: '', cols: 3, rows: 4 },
        { id: 'inboundLiq', goTo: 'Channels', link: '/cl/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 3, rows: 8 },
        { id: 'outboundLiq', goTo: 'Channels', link: '/cl/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 3, rows: 8 }
      ];
    } else {
      this.operatorCardHeight = ((window.screen.height * 0.77) / 2) + 'px';
      this.merchantCardHeight = ((window.screen.height * 0.76) / 10) + 'px';
      this.operatorCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 3, rows: 1 },
        { id: 'balance', goTo: 'On-Chain', link: '/cl/onchain', icon: this.faChartPie, title: 'Balances', cols: 3, rows: 1 },
        { id: 'capacity', goTo: 'Channels', link: '/cl/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 4, rows: 2 },
        { id: 'fee', goTo: 'Routing', link: '/cl/routing', icon: this.faBolt, title: 'Routing Fee', cols: 3, rows: 1 },
        { id: 'status', goTo: 'Channels', link: '/cl/connections', icon: this.faNetworkWired, title: 'Channels', cols: 3, rows: 1 }
      ];
      this.merchantCards = [
        { id: 'balance', goTo: 'On-Chain', link: '/cl/onchain', icon: this.faChartPie, title: 'Balances', cols: 2, rows: 5 },
        { id: 'inboundLiq', goTo: 'Channels', link: '/cl/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 2, rows: 10 },
        { id: 'outboundLiq', goTo: 'Channels', link: '/cl/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 2, rows: 10 },
        { id: 'transactions', goTo: 'Transactions', link: '/cl/transactions', title: '', cols: 2, rows: 5 }
      ];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.flgLoading = [true, true, true, true, true, true, true, true];
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInfo') {
          this.flgLoading[0] = 'error';
        }
        if (effectsErr.action === 'FetchFees') {
          this.flgLoading[1] = 'error';
        }
        if (effectsErr.action === 'FetchBalance') {
          this.flgLoading[2] = 'error';
        }
        if (effectsErr.action === 'FetchLocalRemoteBalance') {
          this.flgLoading[3] = 'error';
        }
        if (effectsErr.action === 'FetchFeeRates') {
          this.flgLoading[4] = 'error';
        }
        if (effectsErr.action === 'FetchChannels') {
          this.flgLoading[5] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( this.information.id) ? false : true;
      }

      this.fees = rtlStore.fees;
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = ( this.fees.feeCollected) ? false : true;
      }

      this.totalBalance = rtlStore.balance;
      this.balances.onchain = rtlStore.balance.totalBalance;
      this.balances.lightning = rtlStore.localRemoteBalance.localBalance;
      this.balances.total = this.balances.lightning + this.balances.onchain;
      this.balances = Object.assign({}, this.balances);
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = ('' !== this.totalBalance) ? false : true;
      }

      let local = (rtlStore.localRemoteBalance.localBalance) ? +rtlStore.localRemoteBalance.localBalance : 0;
      let remote = (rtlStore.localRemoteBalance.remoteBalance) ? +rtlStore.localRemoteBalance.remoteBalance : 0;
      let total = local + remote;
      this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local-remote)/total)).toFixed(3) };
      if (this.flgLoading[3] !== 'error') {
        this.flgLoading[3] = (rtlStore.localRemoteBalance.localBalance) ? false : true;
      }

      this.feeRatesPerKB = rtlStore.feeRatesPerKB;
      this.feeRatesPerKW = rtlStore.feeRatesPerKW;
      if (this.flgLoading[4] !== 'error') {
        this.flgLoading[4] = ( this.feeRatesPerKB &&  this.feeRatesPerKW) ? false : true;
      }

      this.channelsStatus = {
        active: { channels: rtlStore.information.num_active_channels, capacity: rtlStore.localRemoteBalance.localBalance },
        pending: { channels:  rtlStore.information.num_pending_channels, capacity: rtlStore.localRemoteBalance.pendingBalance | 0 },
        inactive: { channels: rtlStore.information.num_inactive_channels, capacity: rtlStore.localRemoteBalance.inactiveBalance | 0 }
      };
      this.totalInboundLiquidity = 0;
      this.totalOutboundLiquidity = 0;
      this.allChannels = rtlStore.allChannels.filter(channel => channel.state === 'CHANNELD_NORMAL' && channel.connected);
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels, 'balancedness')));
      this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels.filter(channel => channel.msatoshi_to_them > 0), 'msatoshi_to_them')));
      this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels.filter(channel => channel.msatoshi_to_us > 0), 'msatoshi_to_us')));
      this.allChannels.forEach(channel => {
        this.totalInboundLiquidity = this.totalInboundLiquidity + Math.ceil(channel.msatoshi_to_them/1000);
        this.totalOutboundLiquidity = this.totalOutboundLiquidity + Math.floor(channel.msatoshi_to_us/1000);
      });
      if (this.flgLoading[5] !== 'error') {
        this.flgLoading[5] = (this.allChannels && this.allChannels.length) ? false : true;
      }      
      if (this.balances.lightning >= 0 && this.balances.onchain >= 0 && this.fees.feeCollected >= 0) {
        this.flgChildInfoUpdated = true;
      } else {
        this.flgChildInfoUpdated = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[2]),
    filter((action) => action.type === CLActions.FETCH_FEES_CL || action.type === CLActions.SET_FEES_CL))
    .subscribe(action => {
      if(action.type === CLActions.FETCH_FEES_CL) {
        this.flgChildInfoUpdated = false;
      }
      if(action.type === CLActions.SET_FEES_CL) {
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
        const x = +a.msatoshi_to_us + +a.msatoshi_to_them;
        const y = +b.msatoshi_to_them + +b.msatoshi_to_them;
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

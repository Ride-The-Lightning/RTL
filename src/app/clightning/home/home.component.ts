import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSmile, faFrown } from '@fortawesome/free-regular-svg-icons';
import { faAngleDoubleDown, faAngleDoubleUp, faChartPie, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import { UserPersonaEnum, ScreenSizeEnum, APICallStatusEnum } from '../../shared/services/consts-enums-functions';
import { ChannelsStatus, GetInfo, Fees, Channel, Balance } from '../../shared/models/clModels';
import { ApiCallsListCL } from '../../shared/models/apiCallsPayload';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';

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
  public operatorCards = [];
  public merchantCards = [];
  public screenSize = '';
  public operatorCardHeight = '330px';
  public merchantCardHeight = '65px';
  public sortField = 'Balance Score';
  public errorMessages = ['', '', '', '', '', ''];
  public apisCallStatus: ApiCallsListCL = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions: Actions, private commonService: CommonService, private router: Router) {
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
      this.errorMessages = ['', '', '', '', '', ''];
      this.apisCallStatus = rtlStore.apisCallStatus;
      if (rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) {
        this.errorMessages[0] = (typeof(this.apisCallStatus.FetchInfo.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchInfo.message) : this.apisCallStatus.FetchInfo.message;
      }
      if (rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) {
        this.errorMessages[1] = (typeof(this.apisCallStatus.FetchFees.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchFees.message) : this.apisCallStatus.FetchFees.message;
      }
      if (rtlStore.apisCallStatus.FetchBalance.status === APICallStatusEnum.ERROR) {
        this.errorMessages[2] = (typeof(this.apisCallStatus.FetchBalance.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchBalance.message) : this.apisCallStatus.FetchBalance.message;
      }
      if (rtlStore.apisCallStatus.FetchLocalRemoteBalance.status === APICallStatusEnum.ERROR) {
        this.errorMessages[3] = (typeof(this.apisCallStatus.FetchLocalRemoteBalance.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchLocalRemoteBalance.message) : this.apisCallStatus.FetchLocalRemoteBalance.message;
      }
      if (rtlStore.apisCallStatus.FetchChannels.status === APICallStatusEnum.ERROR) {
        this.errorMessages[4] = (typeof(this.apisCallStatus.FetchChannels.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchChannels.message) : this.apisCallStatus.FetchChannels.message;
      }
      if (rtlStore.apisCallStatus.GetForwardingHistory.status === APICallStatusEnum.ERROR) {
        this.errorMessages[5] = (typeof(this.apisCallStatus.GetForwardingHistory.message) === 'object') ? JSON.stringify(this.apisCallStatus.GetForwardingHistory.message) : this.apisCallStatus.GetForwardingHistory.message;
      }

      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;

      this.fees = rtlStore.fees;

      this.totalBalance = rtlStore.balance;
      this.balances.onchain = rtlStore.balance.totalBalance;
      this.balances.lightning = rtlStore.localRemoteBalance.localBalance;
      this.balances.total = this.balances.lightning + this.balances.onchain;
      this.balances = Object.assign({}, this.balances);

      let local = (rtlStore.localRemoteBalance.localBalance) ? +rtlStore.localRemoteBalance.localBalance : 0;
      let remote = (rtlStore.localRemoteBalance.remoteBalance) ? +rtlStore.localRemoteBalance.remoteBalance : 0;
      let total = local + remote;
      this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local-remote)/total)).toFixed(3) };

      this.channelsStatus = {
        active: { channels: rtlStore.information.num_active_channels, capacity: rtlStore.localRemoteBalance.localBalance },
        pending: { channels:  rtlStore.information.num_pending_channels, capacity: rtlStore.localRemoteBalance.pendingBalance | 0 },
        inactive: { channels: rtlStore.information.num_inactive_channels, capacity: rtlStore.localRemoteBalance.inactiveBalance | 0 }
      };
      this.totalInboundLiquidity = 0;
      this.totalOutboundLiquidity = 0;
      this.allChannels = rtlStore.allChannels.filter(channel => channel.state === 'CHANNELD_NORMAL' && channel.connected);
      this.allChannelsCapacity = this.allChannels.length > 0 ? JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels, 'balancedness'))) : [];
      this.allInboundChannels = this.allChannels.length > 0 ? JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels.filter(channel => channel.msatoshi_to_them > 0), 'msatoshi_to_them'))) : [];
      this.allOutboundChannels = this.allChannels.length > 0 ? JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels.filter(channel => channel.msatoshi_to_us > 0), 'msatoshi_to_us'))) : [];
      this.allChannels.forEach(channel => {
        this.totalInboundLiquidity = this.totalInboundLiquidity + Math.ceil(channel.msatoshi_to_them/1000);
        this.totalOutboundLiquidity = this.totalOutboundLiquidity + Math.floor(channel.msatoshi_to_us/1000);
      });

      if (this.balances.lightning >= 0 && this.balances.onchain >= 0 && this.fees.feeCollected >= 0) {
        this.flgChildInfoUpdated = true;
      } else {
        this.flgChildInfoUpdated = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions.pipe(takeUntil(this.unSubs[2]),
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
      this.allChannelsCapacity = this.allChannels.sort(function(a, b) {
        const x = +a.msatoshi_to_us + +a.msatoshi_to_them;
        const y = +b.msatoshi_to_them + +b.msatoshi_to_them;
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      });
    } else {
      this.sortField =  'Balance Score';
      this.allChannelsCapacity = this.allChannels.length > 0 ? JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels, 'balancedness'))) : [];
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

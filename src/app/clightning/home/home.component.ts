import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSmile, faFrown } from '@fortawesome/free-regular-svg-icons';
import { faAngleDoubleDown, faAngleDoubleUp, faChartPie, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import { UserPersonaEnum, ScreenSizeEnum, APICallStatusEnum } from '../../shared/services/consts-enums-functions';
import { ChannelsStatus, GetInfo, Fees, Channel, Balance, LocalRemoteBalance } from '../../shared/models/clModels';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';

import { RTLState } from '../../store/rtl.state';
import { balance, channels, fees, localRemoteBalance, nodeInfoAndNodeSettingsAndAPIsStatus } from '../store/cl.selector';

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
  public userPersonaEnum = UserPersonaEnum;
  public channelBalances = { localBalance: 0, remoteBalance: 0, balancedness: 0 };
  public selNode: SelNodeChild = {};
  public fees: Fees;
  public information: GetInfo = {};
  public totalBalance: Balance = {};
  public balances = { onchain: -1, lightning: -1, total: 0 };
  public activeChannels: Channel[] = [];
  public channelsStatus: ChannelsStatus = { active: {}, pending: {}, inactive: {} };
  public activeChannelsCapacity: Channel[] = [];
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
  public apiCallStatusNodeInfo: ApiCallStatusPayload = null;
  public apiCallStatusFees: ApiCallStatusPayload = null;
  public apiCallStatusBalance: ApiCallStatusPayload = null;
  public apiCallStatusLRBal: ApiCallStatusPayload = null;
  public apiCallStatusChannels: ApiCallStatusPayload = null;
  public apiCallStatusFHistory: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private actions: Actions, private commonService: CommonService, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
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
    } else if (this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
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
    this.store.select(nodeInfoAndNodeSettingsAndAPIsStatus).pipe(takeUntil(this.unSubs[0])).
      subscribe((infoSettingsStatusSelector: { information: GetInfo, nodeSettings: SelNodeChild, apisCallStatus: ApiCallStatusPayload[] }) => {
        this.errorMessages[0] = '';
        this.errorMessages[5] = '';
        this.apiCallStatusNodeInfo = infoSettingsStatusSelector.apisCallStatus[0];
        this.apiCallStatusFHistory = infoSettingsStatusSelector.apisCallStatus[1];
        if (this.apiCallStatusNodeInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apiCallStatusNodeInfo.message) === 'object') ? JSON.stringify(this.apiCallStatusNodeInfo.message) : this.apiCallStatusNodeInfo.message;
        }
        if (this.apiCallStatusFHistory.status === APICallStatusEnum.ERROR) {
          this.errorMessages[5] = (typeof (this.apiCallStatusFHistory.message) === 'object') ? JSON.stringify(this.apiCallStatusFHistory.message) : this.apiCallStatusFHistory.message;
        }
        this.selNode = infoSettingsStatusSelector.nodeSettings;
        this.information = infoSettingsStatusSelector.information;
      });
    this.store.select(fees).pipe(takeUntil(this.unSubs[1])).
      subscribe((feesSeletor: { fees: Fees, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[1] = '';
        this.apiCallStatusFees = feesSeletor.apiCallStatus;
        if (this.apiCallStatusFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apiCallStatusFees.message) === 'object') ? JSON.stringify(this.apiCallStatusFees.message) : this.apiCallStatusFees.message;
        }
        this.fees = feesSeletor.fees;
        this.logger.info(feesSeletor);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[2])).
      subscribe((channelsSeletor: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[4] = '';
        this.apiCallStatusChannels = channelsSeletor.apiCallStatus;
        if (this.apiCallStatusChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[4] = (typeof (this.apiCallStatusChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusChannels.message) : this.apiCallStatusChannels.message;
        }
        this.totalInboundLiquidity = 0;
        this.totalOutboundLiquidity = 0;
        this.activeChannels = channelsSeletor.activeChannels;
        this.activeChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.activeChannels, 'balancedness'))) || [];
        this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.activeChannels.filter((channel) => channel.msatoshi_to_them > 0), 'msatoshi_to_them'))) || [];
        this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.activeChannels.filter((channel) => channel.msatoshi_to_us > 0), 'msatoshi_to_us'))) || [];
        this.activeChannels.forEach((channel) => {
          this.totalInboundLiquidity = this.totalInboundLiquidity + Math.ceil(channel.msatoshi_to_them / 1000);
          this.totalOutboundLiquidity = this.totalOutboundLiquidity + Math.floor(channel.msatoshi_to_us / 1000);
        });
        this.channelsStatus.active.channels = channelsSeletor.activeChannels.length || 0;
        this.channelsStatus.pending.channels = channelsSeletor.pendingChannels.length || 0;
        this.channelsStatus.inactive.channels = channelsSeletor.inactiveChannels.length || 0;
        this.logger.info(channelsSeletor);
      });
    this.store.select(balance).pipe(takeUntil(this.unSubs[3]),
      withLatestFrom(this.store.select(localRemoteBalance))).
      subscribe(([balanceSeletor, lrBalanceSeletor]: [{ balance: Balance, apiCallStatus: ApiCallStatusPayload }, { localRemoteBalance: LocalRemoteBalance, apiCallStatus: ApiCallStatusPayload }]) => {
        this.errorMessages[2] = '';
        this.apiCallStatusBalance = balanceSeletor.apiCallStatus;
        if (this.apiCallStatusBalance.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apiCallStatusBalance.message) === 'object') ? JSON.stringify(this.apiCallStatusBalance.message) : this.apiCallStatusBalance.message;
        }
        this.errorMessages[3] = '';
        this.apiCallStatusLRBal = lrBalanceSeletor.apiCallStatus;
        if (this.apiCallStatusLRBal.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apiCallStatusLRBal.message) === 'object') ? JSON.stringify(this.apiCallStatusLRBal.message) : this.apiCallStatusLRBal.message;
        }
        this.totalBalance = balanceSeletor.balance;
        this.balances.onchain = balanceSeletor.balance.totalBalance;
        this.balances.lightning = lrBalanceSeletor.localRemoteBalance.localBalance;
        this.balances.total = this.balances.lightning + this.balances.onchain;
        this.balances = Object.assign({}, this.balances);

        const local = (lrBalanceSeletor.localRemoteBalance.localBalance) ? +lrBalanceSeletor.localRemoteBalance.localBalance : 0;
        const remote = (lrBalanceSeletor.localRemoteBalance.remoteBalance) ? +lrBalanceSeletor.localRemoteBalance.remoteBalance : 0;
        const total = local + remote;
        this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local - remote) / total)).toFixed(3) };
        this.channelsStatus.active.capacity = lrBalanceSeletor.localRemoteBalance.localBalance || 0;
        this.channelsStatus.pending.capacity = lrBalanceSeletor.localRemoteBalance.pendingBalance || 0;
        this.channelsStatus.inactive.capacity = lrBalanceSeletor.localRemoteBalance.inactiveBalance || 0;
        this.logger.info(balanceSeletor);
        this.logger.info(lrBalanceSeletor);
      });
  }

  onNavigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  onsortChannelsBy() {
    if (this.sortField === 'Balance Score') {
      this.sortField = 'Capacity';
      this.activeChannelsCapacity = this.activeChannels.sort((a, b) => {
        const x = +a.msatoshi_to_us + +a.msatoshi_to_them;
        const y = +b.msatoshi_to_them + +b.msatoshi_to_them;
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      });
    } else {
      this.sortField = 'Balance Score';
      this.activeChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.activeChannels, 'balancedness'))) || [];
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

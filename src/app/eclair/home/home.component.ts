import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faSmile, faFrown } from '@fortawesome/free-regular-svg-icons';
import { faAngleDoubleDown, faAngleDoubleUp, faChartPie, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { UserPersonaEnum, ScreenSizeEnum, APICallStatusEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Channel, Fees, OnChainBalance, ChannelsStatus } from '../../shared/models/eclModels';
import { ApiCallsListECL } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import { RTLState } from '../../store/rtl.state';

@Component({
  selector: 'rtl-ecl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class ECLHomeComponent implements OnInit, OnDestroy {

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
  public channels: Channel[] = [];
  public onchainBalance: OnChainBalance = {};
  public balances = { onchain: -1, lightning: -1, total: 0 };
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
  public errorMessages = ['', '', '', ''];
  public apisCallStatus: ApiCallsListECL = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.operatorCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 10, rows: 1 },
        { id: 'balance', goTo: 'On-Chain', link: '/ecl/onchain', icon: this.faChartPie, title: 'Balances', cols: 10, rows: 1 },
        { id: 'fee', goTo: 'Routing', link: '/ecl/routing', icon: this.faBolt, title: 'Routing Fee', cols: 10, rows: 1 },
        { id: 'status', goTo: 'Channels', link: '/ecl/connections', icon: this.faNetworkWired, title: 'Channels', cols: 10, rows: 1 },
        { id: 'capacity', goTo: 'Channels', link: '/ecl/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
      ];
      this.merchantCards = [
        { id: 'balance', goTo: 'On-Chain', link: '/ecl/onchain', icon: this.faChartPie, title: 'Balances', cols: 6, rows: 4 },
        { id: 'transactions', goTo: 'Transactions', link: '/ecl/transactions', title: '', cols: 6, rows: 4 },
        { id: 'inboundLiq', goTo: 'Channels', link: '/ecl/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 6, rows: 8 },
        { id: 'outboundLiq', goTo: 'Channels', link: '/ecl/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 6, rows: 8 }
      ];
    } else if (this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.operatorCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 5, rows: 1 },
        { id: 'balance', goTo: 'On-Chain', link: '/ecl/onchain', icon: this.faChartPie, title: 'Balances', cols: 5, rows: 1 },
        { id: 'fee', goTo: 'Routing', link: '/ecl/routing', icon: this.faBolt, title: 'Routing Fee', cols: 5, rows: 1 },
        { id: 'status', goTo: 'Channels', link: '/ecl/connections', icon: this.faNetworkWired, title: 'Channels', cols: 5, rows: 1 },
        { id: 'capacity', goTo: 'Channels', link: '/ecl/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
      ];
      this.merchantCards = [
        { id: 'balance', goTo: 'On-Chain', link: '/ecl/onchain', icon: this.faChartPie, title: 'Balances', cols: 3, rows: 4 },
        { id: 'transactions', goTo: 'Transactions', link: '/ecl/transactions', title: '', cols: 3, rows: 4 },
        { id: 'inboundLiq', goTo: 'Channels', link: '/ecl/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 3, rows: 8 },
        { id: 'outboundLiq', goTo: 'Channels', link: '/ecl/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 3, rows: 8 }
      ];
    } else {
      this.operatorCardHeight = ((window.screen.height - 200) / 2) + 'px';
      this.merchantCardHeight = ((window.screen.height - 210) / 10) + 'px';
      this.operatorCards = [
        { id: 'node', icon: this.faServer, title: 'Node Information', cols: 3, rows: 1 },
        { id: 'balance', goTo: 'On-Chain', link: '/ecl/onchain', icon: this.faChartPie, title: 'Balances', cols: 3, rows: 1 },
        { id: 'capacity', goTo: 'Channels', link: '/ecl/connections', icon: this.faNetworkWired, title: 'Channels Capacity', cols: 4, rows: 2 },
        { id: 'fee', goTo: 'Routing', link: '/ecl/routing', icon: this.faBolt, title: 'Routing Fee', cols: 3, rows: 1 },
        { id: 'status', goTo: 'Channels', link: '/ecl/connections', icon: this.faNetworkWired, title: 'Channels', cols: 3, rows: 1 }
      ];
      this.merchantCards = [
        { id: 'balance', goTo: 'On-Chain', link: '/ecl/onchain', icon: this.faChartPie, title: 'Balances', cols: 2, rows: 5 },
        { id: 'inboundLiq', goTo: 'Channels', link: '/ecl/connections', icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 2, rows: 10 },
        { id: 'outboundLiq', goTo: 'Channels', link: '/ecl/connections', icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 2, rows: 10 },
        { id: 'transactions', goTo: 'Transactions', link: '/ecl/transactions', title: '', cols: 2, rows: 5 }
      ];
    }
  }

  ngOnInit() {
    this.store.select('ecl').
      pipe(takeUntil(this.unSubs[1])).
      subscribe((rtlStore) => {
        this.errorMessages = ['', '', '', ''];
        this.apisCallStatus = rtlStore.apisCallStatus;
        if (rtlStore.apisCallStatus.FetchInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apisCallStatus.FetchInfo.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchInfo.message) : this.apisCallStatus.FetchInfo.message;
        }
        if (rtlStore.apisCallStatus.FetchFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apisCallStatus.FetchFees.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchFees.message) : this.apisCallStatus.FetchFees.message;
        }
        if (rtlStore.apisCallStatus.FetchChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apisCallStatus.FetchChannels.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchChannels.message) : this.apisCallStatus.FetchChannels.message;
        }
        if (rtlStore.apisCallStatus.FetchOnchainBalance.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apisCallStatus.FetchOnchainBalance.message) === 'object') ? JSON.stringify(this.apisCallStatus.FetchOnchainBalance.message) : this.apisCallStatus.FetchOnchainBalance.message;
        }
        this.selNode = rtlStore.nodeSettings;
        this.information = rtlStore.information;
        this.fees = rtlStore.fees;
        this.channels = rtlStore.activeChannels;
        this.onchainBalance = rtlStore.onchainBalance;
        this.balances.onchain = this.onchainBalance.total;
        this.balances.lightning = rtlStore.lightningBalance.localBalance;
        this.balances.total = this.balances.lightning + this.balances.onchain;
        this.balances = Object.assign({}, this.balances);
        const local = (rtlStore.lightningBalance.localBalance) ? +rtlStore.lightningBalance.localBalance : 0;
        const remote = (rtlStore.lightningBalance.remoteBalance) ? +rtlStore.lightningBalance.remoteBalance : 0;
        const total = local + remote;
        this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local - remote) / total)).toFixed(3) };
        this.channelsStatus = rtlStore.channelsStatus;
        this.totalInboundLiquidity = 0;
        this.totalOutboundLiquidity = 0;
        this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels, 'balancedness')));
        this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels.filter((channel) => channel.toRemote > 0), 'toRemote')));
        this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels.filter((channel) => channel.toLocal > 0), 'toLocal')));
        this.channels.forEach((channel) => {
          this.totalInboundLiquidity = this.totalInboundLiquidity + Math.ceil(channel.toRemote);
          this.totalOutboundLiquidity = this.totalOutboundLiquidity + Math.floor(channel.toLocal);
        });
        this.logger.info(rtlStore);
      });
  }

  onNavigateTo(link: string) {
    this.router.navigateByUrl(link);
  }

  onsortChannelsBy() {
    if (this.sortField === 'Balance Score') {
      this.sortField = 'Capacity';
      this.allChannelsCapacity = this.channels.sort((a, b) => {
        const x = +a.toLocal + +a.toRemote;
        const y = +b.toLocal + +b.toRemote;
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      });
    } else {
      this.sortField = 'Balance Score';
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels, 'balancedness')));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

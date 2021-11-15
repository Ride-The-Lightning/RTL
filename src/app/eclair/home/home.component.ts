import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faSmile, faFrown } from '@fortawesome/free-regular-svg-icons';
import { faAngleDoubleDown, faAngleDoubleUp, faChartPie, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { UserPersonaEnum, ScreenSizeEnum, APICallStatusEnum } from '../../shared/services/consts-enums-functions';
import { GetInfo, Channel, Fees, OnChainBalance, ChannelsStatus, LightningBalance } from '../../shared/models/eclModels';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import { RTLState } from '../../store/rtl.state';
import { allChannelsInfo, nodeInfoStatus, eclNodeInformation, eclNodeSettings, fees, onchainBalance } from '../store/ecl.selector';

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
  public apiCallStatusNodeInfo: ApiCallStatusPayload = null;
  public apiCallStatusFees: ApiCallStatusPayload = null;
  public apiCallStatusOCBal: ApiCallStatusPayload = null;
  public apiCallStatusAllChannels: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

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
    this.store.select(eclNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings) => {
        this.selNode = nodeSettings;
      });
    this.store.select(nodeInfoStatus).pipe(takeUntil(this.unSubs[1])).
      subscribe((selNodeInfoStatus: { information: GetInfo, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[0] = '';
        this.apiCallStatusNodeInfo = selNodeInfoStatus.apiCallStatus;
        if (this.apiCallStatusNodeInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apiCallStatusNodeInfo.message) === 'object') ? JSON.stringify(this.apiCallStatusNodeInfo.message) : this.apiCallStatusNodeInfo.message;
        }
        this.information = selNodeInfoStatus.information;
      });
    this.store.select(fees).pipe(takeUntil(this.unSubs[2])).
      subscribe((selFees: { fees: Fees, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[1] = '';
        this.apiCallStatusFees = selFees.apiCallStatus;
        if (this.apiCallStatusFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apiCallStatusFees.message) === 'object') ? JSON.stringify(this.apiCallStatusFees.message) : this.apiCallStatusFees.message;
        }
        this.fees = selFees.fees;
      });
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[3]),
      withLatestFrom(this.store.select(onchainBalance))).
      subscribe(([selAllChannels, selOCBal]: [{ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload }, { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }]) => {
        this.errorMessages[2] = '';
        this.errorMessages[3] = '';
        this.apiCallStatusAllChannels = selAllChannels.apiCallStatus;
        this.apiCallStatusOCBal = selOCBal.apiCallStatus;
        if (this.apiCallStatusAllChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apiCallStatusAllChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusAllChannels.message) : this.apiCallStatusAllChannels.message;
        }
        if (this.apiCallStatusOCBal.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apiCallStatusOCBal.message) === 'object') ? JSON.stringify(this.apiCallStatusOCBal.message) : this.apiCallStatusOCBal.message;
        }
        this.channels = selAllChannels.activeChannels;
        this.onchainBalance = selOCBal.onchainBalance;
        this.balances.onchain = this.onchainBalance.total;
        this.balances.lightning = selAllChannels.lightningBalance.localBalance;
        this.balances.total = this.balances.lightning + this.balances.onchain;
        this.balances = Object.assign({}, this.balances);
        const local = (selAllChannels.lightningBalance.localBalance) ? +selAllChannels.lightningBalance.localBalance : 0;
        const remote = (selAllChannels.lightningBalance.remoteBalance) ? +selAllChannels.lightningBalance.remoteBalance : 0;
        const total = local + remote;
        this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local - remote) / total)).toFixed(3) };
        this.channelsStatus = selAllChannels.channelsStatus;
        this.totalInboundLiquidity = 0;
        this.totalOutboundLiquidity = 0;
        this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels, 'balancedness')));
        this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels.filter((channel) => channel.toRemote > 0), 'toRemote')));
        this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels.filter((channel) => channel.toLocal > 0), 'toLocal')));
        this.channels.forEach((channel) => {
          this.totalInboundLiquidity = this.totalInboundLiquidity + Math.ceil(channel.toRemote);
          this.totalOutboundLiquidity = this.totalOutboundLiquidity + Math.floor(channel.toLocal);
        });
        this.logger.info(selAllChannels);
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

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
import { allChannelsInfo, eclnNodeSettings, fees, nodeInfoStatus, onchainBalance } from '../store/ecl.selector';

export interface Tile {
  id: string;
  title: string;
  cols: number;
  rows: number;
  goToOptions?: string[];
  links?: string[];
  icon?: any;
}

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
  public selNode: SelNodeChild | null = {};
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
  public operatorCards: Tile[] = [];
  public merchantCards: Tile[] = [];
  public screenSize = '';
  public operatorCardHeight = '405px';
  public merchantCardHeight = '65px';
  public sortField = 'Balance Score';
  public errorMessages = ['', '', '', ''];
  public apiCallStatusNodeInfo: ApiCallStatusPayload = { status: APICallStatusEnum.COMPLETED };
  public apiCallStatusFees: ApiCallStatusPayload = { status: APICallStatusEnum.COMPLETED };
  public apiCallStatusOCBal: ApiCallStatusPayload = { status: APICallStatusEnum.COMPLETED };
  public apiCallStatusAllChannels: ApiCallStatusPayload = { status: APICallStatusEnum.COMPLETED };
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.operatorCards = [
        { id: 'node', goToOptions: [], links: [], icon: this.faServer, title: 'Node Information', cols: 10, rows: 1 },
        { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 10, rows: 1 },
        { id: 'fee', goToOptions: ['Routing', 'Fees Summary'], links: ['routing', 'reports'], icon: this.faBolt, title: 'Routing Fee', cols: 10, rows: 1 },
        { id: 'status', goToOptions: ['Channels', 'Inactive Channels'], links: ['connections', 'connections/channels/inactive'], icon: this.faNetworkWired, title: 'Channels', cols: 10, rows: 1 },
        { id: 'capacity', goToOptions: ['Channels'], links: ['connections'], icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
      ];
      this.merchantCards = [
        { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 6, rows: 4 },
        { id: 'transactions', goToOptions: ['Transactions', 'Transactions Summary'], links: ['transactions', 'reports/transactions'], title: '', cols: 6, rows: 4 },
        { id: 'inboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 6, rows: 8 },
        { id: 'outboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 6, rows: 8 }
      ];
    } else if (this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.operatorCards = [
        { id: 'node', goToOptions: [], links: [], icon: this.faServer, title: 'Node Information', cols: 5, rows: 1 },
        { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 5, rows: 1 },
        { id: 'fee', goToOptions: ['Routing', 'Fees Summary'], links: ['routing', 'reports'], icon: this.faBolt, title: 'Routing Fee', cols: 5, rows: 1 },
        { id: 'status', goToOptions: ['Channels', 'Inactive Channels'], links: ['connections', 'connections/channels/inactive'], icon: this.faNetworkWired, title: 'Channels', cols: 5, rows: 1 },
        { id: 'capacity', goToOptions: ['Channels'], links: ['connections'], icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
      ];
      this.merchantCards = [
        { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 3, rows: 4 },
        { id: 'transactions', goToOptions: ['Transactions', 'Transactions Summary'], links: ['transactions', 'reports/transactions'], title: '', cols: 3, rows: 4 },
        { id: 'inboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 3, rows: 8 },
        { id: 'outboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 3, rows: 8 }
      ];
    } else {
      this.operatorCards = [
        { id: 'node', goToOptions: [], links: [], icon: this.faServer, title: 'Node Information', cols: 3, rows: 1 },
        { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 3, rows: 1 },
        { id: 'capacity', goToOptions: ['Channels'], links: ['connections'], icon: this.faNetworkWired, title: 'Channels Capacity', cols: 4, rows: 2 },
        { id: 'fee', goToOptions: ['Routing', 'Fees Summary'], links: ['routing', 'reports'], icon: this.faBolt, title: 'Routing Fee', cols: 3, rows: 1 },
        { id: 'status', goToOptions: ['Channels', 'Inactive Channels'], links: ['connections', 'connections/channels/inactive'], icon: this.faNetworkWired, title: 'Channels', cols: 3, rows: 1 }
      ];
      this.merchantCards = [
        { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 2, rows: 5 },
        { id: 'inboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 2, rows: 10 },
        { id: 'outboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 2, rows: 10 },
        { id: 'transactions', goToOptions: ['Transactions', 'Transactions Summary'], links: ['transactions', 'reports/transactions'], title: '', cols: 2, rows: 5 }
      ];
    }
  }

  ngOnInit() {
    this.store.select(eclnNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings) => {
        this.selNode = nodeSettings;
      });
    this.store.select(nodeInfoStatus).pipe(takeUntil(this.unSubs[1])).
      subscribe((selNodeInfoStatusSelector: { information: GetInfo, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[0] = '';
        this.apiCallStatusNodeInfo = selNodeInfoStatusSelector.apiCallStatus;
        if (this.apiCallStatusNodeInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apiCallStatusNodeInfo.message) === 'object') ? JSON.stringify(this.apiCallStatusNodeInfo.message) : this.apiCallStatusNodeInfo.message ? this.apiCallStatusNodeInfo.message : '';
        }
        this.information = selNodeInfoStatusSelector.information;
      });

    this.store.select(fees).pipe(takeUntil(this.unSubs[2])).
      subscribe((feesSelector: { fees: Fees, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[1] = '';
        this.apiCallStatusFees = feesSelector.apiCallStatus;
        if (this.apiCallStatusFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apiCallStatusFees.message) === 'object') ? JSON.stringify(this.apiCallStatusFees.message) : this.apiCallStatusFees.message ? this.apiCallStatusFees.message : '';
        }
        this.fees = feesSelector.fees;
      });
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[3]),
      withLatestFrom(this.store.select(onchainBalance))).
      subscribe(([allChannelsSelector, oCBalanceSelector]: [({ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload }), ({ onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload })]) => {
        this.errorMessages[2] = '';
        this.errorMessages[3] = '';
        this.apiCallStatusAllChannels = allChannelsSelector.apiCallStatus;
        this.apiCallStatusOCBal = oCBalanceSelector.apiCallStatus;
        if (this.apiCallStatusAllChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apiCallStatusAllChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusAllChannels.message) : this.apiCallStatusAllChannels.message ? this.apiCallStatusAllChannels.message : '';
        }
        if (this.apiCallStatusOCBal.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apiCallStatusOCBal.message) === 'object') ? JSON.stringify(this.apiCallStatusOCBal.message) : this.apiCallStatusOCBal.message ? this.apiCallStatusOCBal.message : '';
        }
        this.channels = allChannelsSelector.activeChannels;
        this.onchainBalance = oCBalanceSelector.onchainBalance;
        this.balances.onchain = this.onchainBalance.total || 0;
        this.balances.lightning = allChannelsSelector.lightningBalance.localBalance;
        this.balances.total = this.balances.lightning + this.balances.onchain;
        this.balances = Object.assign({}, this.balances);
        const local = (allChannelsSelector.lightningBalance.localBalance) ? +allChannelsSelector.lightningBalance.localBalance : 0;
        const remote = (allChannelsSelector.lightningBalance.remoteBalance) ? +allChannelsSelector.lightningBalance.remoteBalance : 0;
        const total = local + remote;
        this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local - remote) / total)).toFixed(3) };
        this.channelsStatus = allChannelsSelector.channelsStatus;
        this.totalInboundLiquidity = 0;
        this.totalOutboundLiquidity = 0;
        this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels, 'balancedness')));
        this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels?.filter((channel: Channel) => (channel.toRemote || 0) > 0), 'toRemote')));
        this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels?.filter((channel: Channel) => (channel.toLocal || 0) > 0), 'toLocal')));
        this.channels.forEach((channel: Channel) => {
          this.totalInboundLiquidity = this.totalInboundLiquidity + Math.ceil(channel.toRemote || 0);
          this.totalOutboundLiquidity = this.totalOutboundLiquidity + Math.floor(channel.toLocal || 0);
        });
        this.logger.info(allChannelsSelector);
      });
  }

  onNavigateTo(link: string) {
    this.router.navigateByUrl('/ecl/' + link);
  }

  onsortChannelsBy() {
    if (this.sortField === 'Balance Score') {
      this.sortField = 'Capacity';
      this.allChannelsCapacity = this.channels.sort((a: Channel, b: Channel) => {
        const x = +(a.toLocal || 0) + +(a.toRemote || 0);
        const y = +(b.toLocal || 0) + +(b.toRemote || 0);
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      });
    } else {
      this.sortField = 'Balance Score';
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels, 'balancedness')));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

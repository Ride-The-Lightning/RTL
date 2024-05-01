import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSmile, faFrown } from '@fortawesome/free-regular-svg-icons';
import { faAngleDoubleDown, faAngleDoubleUp, faChartPie, faBolt, faServer, faNetworkWired } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { CommonService } from '../../shared/services/common.service';
import { UserPersonaEnum, ScreenSizeEnum, APICallStatusEnum, LNDActions } from '../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { ChannelsStatus, GetInfo, Fees, Channel, BlockchainBalance, PendingChannels, PendingChannelsSummary, ChannelsSummary, LightningBalance } from '../../shared/models/lndModels';
import { Node } from '../../shared/models/RTLconfig';

import { RTLState } from '../../store/rtl.state';
import { rootSelectedNode } from 'src/app/store/rtl.selector';
import { blockchainBalance, channels, fees, nodeInfoAndAPIStatus, pendingChannels } from '../store/lnd.selector';

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
  public channelBalances = { localBalance: 0, remoteBalance: 0, balancedness: 0 };
  public selNode: Node | null;
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
  public operatorCardHeight = '390px';
  public merchantCardHeight = '62px';
  public sortField = 'Balance Score';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessages = ['', '', '', '', ''];
  public apiCallStatusNodeInfo: ApiCallStatusPayload | null = null;
  public apiCallStatusFees: ApiCallStatusPayload | null = null;
  public apiCallStatusBlockchainBalance: ApiCallStatusPayload | null = null;
  public apiCallStatusChannels: ApiCallStatusPayload | null = null;
  public apiCallStatusPendingChannels: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private actions: Actions, private commonService: CommonService, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    switch (this.screenSize) {
      case ScreenSizeEnum.XS:
        this.operatorCards = [
          { id: 'node', goToOptions: [], links: [], icon: this.faServer, title: 'Node Information', cols: 10, rows: 1 },
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 10, rows: 1 },
          { id: 'fee', goToOptions: ['Routing', 'Fees Summary'], links: ['routing', 'reports'], icon: this.faBolt, title: 'Routing Fee', cols: 10, rows: 1 },
          { id: 'status', goToOptions: ['Channels', 'Inactive Channels'], links: ['connections', 'inactive'], icon: this.faNetworkWired, title: 'Channels', cols: 10, rows: 1 },
          { id: 'capacity', goToOptions: ['Channels'], links: ['connections'], icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
        ];
        this.merchantCards = [
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 6, rows: 4 },
          { id: 'transactions', goToOptions: ['Transactions', 'Transactions Summary'], links: ['transactions', 'reports/transactions'], title: '', cols: 6, rows: 6 },
          { id: 'inboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 6, rows: 8 },
          { id: 'outboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 6, rows: 8 }
        ];
        break;

      case ScreenSizeEnum.SM:
        this.operatorCards = [
          { id: 'node', goToOptions: [], links: [], icon: this.faServer, title: 'Node Information', cols: 5, rows: 1 },
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 5, rows: 1 },
          { id: 'fee', goToOptions: ['Routing', 'Fees Summary'], links: ['routing', 'reports'], icon: this.faBolt, title: 'Routing Fee', cols: 5, rows: 1 },
          { id: 'status', goToOptions: ['Channels', 'Inactive Channels'], links: ['connections', 'inactive'], icon: this.faNetworkWired, title: 'Channels', cols: 5, rows: 1 },
          { id: 'capacity', goToOptions: ['Channels'], links: ['connections'], icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
        ];
        this.merchantCards = [
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 3, rows: 4 },
          { id: 'transactions', goToOptions: ['Transactions', 'Transactions Summary'], links: ['transactions', 'reports/transactions'], title: '', cols: 3, rows: 4 },
          { id: 'inboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 3, rows: 8 },
          { id: 'outboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 3, rows: 8 }
        ];
        break;

      case ScreenSizeEnum.MD:
        this.operatorCards = [
          { id: 'node', goToOptions: [], links: [], icon: this.faServer, title: 'Node Information', cols: 5, rows: 1 },
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 5, rows: 1 },
          { id: 'fee', goToOptions: ['Routing', 'Fees Summary'], links: ['routing', 'reports'], icon: this.faBolt, title: 'Routing Fee', cols: 5, rows: 1 },
          { id: 'status', goToOptions: ['Channels', 'Inactive Channels'], links: ['connections', 'inactive'], icon: this.faNetworkWired, title: 'Channels', cols: 5, rows: 1 },
          { id: 'capacity', goToOptions: ['Channels'], links: ['connections'], icon: this.faNetworkWired, title: 'Channels Capacity', cols: 10, rows: 2 }
        ];
        this.merchantCards = [
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 3, rows: 4 },
          { id: 'transactions', goToOptions: ['Transactions', 'Transactions Summary'], links: ['transactions', 'reports/transactions'], title: '', cols: 3, rows: 4 },
          { id: 'inboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 3, rows: 8 },
          { id: 'outboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 3, rows: 8 }
        ];
        break;

      default:
        this.operatorCards = [
          { id: 'node', goToOptions: [], links: [], icon: this.faServer, title: 'Node Information', cols: 3, rows: 1 },
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 3, rows: 1 },
          { id: 'capacity', goToOptions: ['Channels'], links: ['connections'], icon: this.faNetworkWired, title: 'Channels Capacity', cols: 4, rows: 2 },
          { id: 'fee', goToOptions: ['Routing', 'Fees Summary'], links: ['routing', 'reports'], icon: this.faBolt, title: 'Routing Fee', cols: 3, rows: 1 },
          { id: 'status', goToOptions: ['Channels', 'Inactive Channels'], links: ['connections', 'inactive'], icon: this.faNetworkWired, title: 'Channels', cols: 3, rows: 1 }
        ];
        this.merchantCards = [
          { id: 'balance', goToOptions: ['On-Chain'], links: ['onchain'], icon: this.faChartPie, title: 'Balances', cols: 2, rows: 5 },
          { id: 'inboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleDown, title: 'In-Bound Liquidity', cols: 2, rows: 10 },
          { id: 'outboundLiq', goToOptions: ['Channels'], links: ['connections'], icon: this.faAngleDoubleUp, title: 'Out-Bound Liquidity', cols: 2, rows: 10 },
          { id: 'transactions', goToOptions: ['Transactions', 'Transactions Summary'], links: ['transactions', 'reports/transactions'], title: '', cols: 2, rows: 5 }
        ];
        break;
    }
  }

  ngOnInit() {
    this.store.select(nodeInfoAndAPIStatus).pipe(takeUntil(this.unSubs[0]),
      withLatestFrom(this.store.select(rootSelectedNode))).
      subscribe(([infoStatusSelector, nodeSettings]: [{ information: GetInfo | null, apiCallStatus: ApiCallStatusPayload }, nodeSettings: Node]) => {
        this.errorMessages[0] = '';
        this.apiCallStatusNodeInfo = infoStatusSelector.apiCallStatus;
        if (this.apiCallStatusNodeInfo.status === APICallStatusEnum.ERROR) {
          this.errorMessages[0] = (typeof (this.apiCallStatusNodeInfo.message) === 'object') ? JSON.stringify(this.apiCallStatusNodeInfo.message) : this.apiCallStatusNodeInfo.message ? this.apiCallStatusNodeInfo.message : '';
        }
        this.selNode = nodeSettings;
        this.information = infoStatusSelector.information;
      });
    this.store.select(fees).pipe(takeUntil(this.unSubs[1])).
      subscribe((feesSelector: { fees: Fees, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[1] = '';
        this.apiCallStatusFees = feesSelector.apiCallStatus;
        if (this.apiCallStatusFees.status === APICallStatusEnum.ERROR) {
          this.errorMessages[1] = (typeof (this.apiCallStatusFees.message) === 'object') ? JSON.stringify(this.apiCallStatusFees.message) : this.apiCallStatusFees.message ? this.apiCallStatusFees.message : '';
        }
        this.fees = feesSelector.fees;
      });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[2])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[2] = '';
        this.apiCallStatusBlockchainBalance = bcBalanceSelector.apiCallStatus;
        if (this.apiCallStatusBlockchainBalance.status === APICallStatusEnum.ERROR) {
          this.errorMessages[2] = (typeof (this.apiCallStatusBlockchainBalance.message) === 'object') ? JSON.stringify(this.apiCallStatusBlockchainBalance.message) : this.apiCallStatusBlockchainBalance.message ? this.apiCallStatusBlockchainBalance.message : '';
        }
        this.balances.onchain = (bcBalanceSelector.blockchainBalance.total_balance && +bcBalanceSelector.blockchainBalance.total_balance >= 0) ? +bcBalanceSelector.blockchainBalance.total_balance : 0;
        this.balances.total = this.balances.lightning + this.balances.onchain;
        this.balances = Object.assign({}, this.balances);
      });
    this.store.select(pendingChannels).pipe(takeUntil(this.unSubs[3])).
      subscribe((pendingChannelsSelector: { pendingChannels: PendingChannels, pendingChannelsSummary: PendingChannelsSummary, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[4] = '';
        this.apiCallStatusPendingChannels = pendingChannelsSelector.apiCallStatus;
        if (this.apiCallStatusPendingChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[4] = (typeof (this.apiCallStatusPendingChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusPendingChannels.message) : this.apiCallStatusPendingChannels.message ? this.apiCallStatusPendingChannels.message : '';
        }
        this.channelsStatus.pending = { num_channels: pendingChannelsSelector.pendingChannelsSummary.open?.num_channels, capacity: pendingChannelsSelector.pendingChannelsSummary.open?.limbo_balance };
        this.channelsStatus.closing = {
          num_channels: (pendingChannelsSelector.pendingChannelsSummary.closing?.num_channels || 0) + (pendingChannelsSelector.pendingChannelsSummary.force_closing?.num_channels || 0) + (pendingChannelsSelector.pendingChannelsSummary.waiting_close?.num_channels || 0),
          capacity: pendingChannelsSelector.pendingChannelsSummary.total_limbo_balance
        };
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[4])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessages[3] = '';
        this.apiCallStatusChannels = channelsSelector.apiCallStatus;
        if (this.apiCallStatusChannels.status === APICallStatusEnum.ERROR) {
          this.errorMessages[3] = (typeof (this.apiCallStatusChannels.message) === 'object') ? JSON.stringify(this.apiCallStatusChannels.message) : this.apiCallStatusChannels.message ? this.apiCallStatusChannels.message : '';
        }
        const local = (channelsSelector.lightningBalance && channelsSelector.lightningBalance.local) ? +channelsSelector.lightningBalance.local : 0;
        const remote = (channelsSelector.lightningBalance && channelsSelector.lightningBalance.remote) ? +channelsSelector.lightningBalance.remote : 0;
        const total = local + remote;
        this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local - remote) / total)).toFixed(3) };
        this.balances.lightning = channelsSelector.lightningBalance.local || 0;
        this.balances.total = this.balances.lightning + this.balances.onchain;
        this.balances = Object.assign({}, this.balances);
        this.activeChannels = channelsSelector.channelsSummary.active?.num_channels || 0;
        this.inactiveChannels = channelsSelector.channelsSummary.inactive?.num_channels || 0;
        this.channelsStatus.active = channelsSelector.channelsSummary.active;
        this.channelsStatus.inactive = channelsSelector.channelsSummary.inactive;
        this.totalInboundLiquidity = 0;
        this.totalOutboundLiquidity = 0;
        this.allChannels = channelsSelector.channels?.filter((channel) => channel.active === true);
        this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels, 'balancedness')));
        this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels?.filter((channel) => channel.remote_balance && channel.remote_balance > 0), 'remote_balance')));
        this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels?.filter((channel) => channel.local_balance && channel.local_balance > 0), 'local_balance')));
        this.allChannels.forEach((channel) => {
          this.totalInboundLiquidity = this.totalInboundLiquidity + +(channel.remote_balance || 0);
          this.totalOutboundLiquidity = this.totalOutboundLiquidity + +(channel.local_balance || 0);
        });
        if (this.balances.lightning >= 0 && this.balances.onchain >= 0 && this.fees.month_fee_sum && this.fees.month_fee_sum >= 0) {
          this.flgChildInfoUpdated = true;
        } else {
          this.flgChildInfoUpdated = false;
        }
        this.logger.info(channelsSelector);
      });
    this.actions.pipe(
      takeUntil(this.unSubs[5]),
      filter((action) => action.type === LNDActions.FETCH_FEES_LND || action.type === LNDActions.SET_FEES_LND)).
      subscribe((action) => {
        if (action.type === LNDActions.FETCH_FEES_LND) {
          this.flgChildInfoUpdated = false;
        }
        if (action.type === LNDActions.SET_FEES_LND) {
          this.flgChildInfoUpdated = true;
        }
      });
  }

  onNavigateTo(link: string) {
    if (link === 'inactive') {
      this.router.navigateByUrl('/lnd/connections', { state: { filterColumn: 'active', filterValue: link } });
    } else {
      this.router.navigateByUrl('/lnd/' + link);
    }
  }

  onsortChannelsBy() {
    if (this.sortField === 'Balance Score') {
      this.sortField = 'Capacity';
      this.allChannelsCapacity = this.allChannels.sort((a, b) => {
        const x = +(a.local_balance || 0) + +(a.remote_balance || 0);
        const y = +(b.local_balance || 0) + +(b.remote_balance || 0);
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      });
    } else {
      this.sortField = 'Balance Score';
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.allChannels, 'balancedness')));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

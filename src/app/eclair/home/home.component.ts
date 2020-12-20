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
import { GetInfo, Channel, Fees, OnChainBalance, ChannelsStatus } from '../../shared/models/eclModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import * as fromRTLReducer from '../../store/rtl.reducers';
import * as ECLActions from '../store/ecl.actions';

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
  public flgChildInfoUpdated = false;
  public userPersonaEnum = UserPersonaEnum;
  public channelBalances = {localBalance: 0, remoteBalance: 0, balancedness: 0};
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
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true, true, true]; // 0: Info, 1: Fee, 2: Wallet, 3: Channel, 4: Network
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private commonService: CommonService, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
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
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
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
    this.store.select('ecl')
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
        if (effectsErr.action === 'FetchChannels') {
          this.flgLoading[2] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (this.information.nodeId) ? false : true;
      }

      this.fees = rtlStore.fees;
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = (this.fees.daily_fee) ? false : true;
      }

      this.channels = rtlStore.activeChannels;
      this.onchainBalance = rtlStore.onchainBalance;
      this.balances.onchain = this.onchainBalance.total;
      this.balances.lightning = rtlStore.lightningBalance.localBalance;
      this.balances.total = this.balances.lightning + this.balances.onchain;
      this.balances = Object.assign({}, this.balances);
      let local = (rtlStore.lightningBalance.localBalance) ? +rtlStore.lightningBalance.localBalance : 0;
      let remote = (rtlStore.lightningBalance.remoteBalance) ? +rtlStore.lightningBalance.remoteBalance : 0;
      let total = local + remote;
      this.channelBalances = { localBalance: local, remoteBalance: remote, balancedness: +(1 - Math.abs((local-remote)/total)).toFixed(3) };
      this.channelsStatus = rtlStore.channelsStatus;
      this.totalInboundLiquidity = 0;
      this.totalOutboundLiquidity = 0;
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels, 'balancedness')));
      this.allInboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels.filter(channel => channel.toRemote > 0), 'toRemote')));
      this.allOutboundChannels = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels.filter(channel => channel.toLocal > 0), 'toLocal')));
      this.channels.forEach(channel => {
        this.totalInboundLiquidity = this.totalInboundLiquidity + Math.ceil(channel.toRemote);
        this.totalOutboundLiquidity = this.totalOutboundLiquidity + Math.floor(channel.toLocal);
      });
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = (this.channels) ? false : true;
      }
      if (this.balances.lightning >= 0 && this.balances.onchain >= 0 && this.fees.monthly_fee >= 0) {
        this.flgChildInfoUpdated = true;
      } else {
        this.flgChildInfoUpdated = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[2]),
    filter((action) => action.type === ECLActions.FETCH_FEES_ECL || action.type === ECLActions.SET_FEES_ECL))
    .subscribe(action => {
      if(action.type === ECLActions.FETCH_FEES_ECL) {
        this.flgChildInfoUpdated = false;
      }
      if(action.type === ECLActions.SET_FEES_ECL) {
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
      this.allChannelsCapacity = this.channels.sort(function (a, b) {
        const x = +a.toLocal + +a.toRemote;
        const y = +b.toLocal + +b.toRemote;
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      });
    } else {
      this.sortField =  'Balance Score';
      this.allChannelsCapacity = JSON.parse(JSON.stringify(this.commonService.sortDescByKey(this.channels, 'balancedness')));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

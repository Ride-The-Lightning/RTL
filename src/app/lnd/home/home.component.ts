import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo, NetworkInfo, Fees, Peer } from '../../shared/models/lndModels';
import { Node } from '../../shared/models/RTLconfig';

import * as fromApp from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public selNode: Node;
  public fees: Fees;
  public information: GetInfo = {};
  public remainder = 0;
  public totalPeers = -1;
  public totalBalance = '';
  public channelBalance = '';
  public BTCtotalBalance = '';
  public BTCchannelBalance = '';
  public networkInfo: NetworkInfo = {};
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true, true, true]; // 0: Info, 1: Fee, 2: Wallet, 3: Channel, 4: Network
  private unsubs: Array<Subject<void>> = [new Subject(), new Subject()];
  public channels: any;
  public position = 'below';
  public activeChannels = 0;
  public inactiveChannels = 0;
  public pendingChannels = 0;
  public peers: Peer[] = [];
  barPadding = 0;
  maxBalanceValue = 0;
  totalBalances = [...[{'name': 'Local Balance', 'value': 0}, {'name': 'Remote Balance', 'value': 0}]];
  flgTotalCalculated = false;
  view = [];
  yAxisLabel = 'Balance';
  colorScheme = {domain: ['#FFFFFF']};

  constructor(private logger: LoggerService, private store: Store<fromApp.AppState>) {
    switch (true) {
      case (window.innerWidth <= 730):
        this.view = [250, 352];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.view = [280, 352];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.view = [300, 352];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.view = [350, 352];
        break;
      default:
        this.view = [300, 352];
        break;
    }
    Object.assign(this, this.totalBalances);
  }

  ngOnInit() {
    this.flgTotalCalculated = false;
    this.store.select('lnd')
    .pipe(takeUntil(this.unsubs[1]))
    .subscribe(lndStore => {
      this.information = lndStore.information;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.information.identity_pubkey) ? false : true;
      }
      this.fees = lndStore.fees;
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = (undefined !== this.fees.day_fee_sum) ? false : true;
      }
      this.totalBalance = lndStore.blockchainBalance.total_balance;
      this.BTCtotalBalance = lndStore.blockchainBalance.btc_total_balance;
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = ('' !== this.totalBalance) ? false : true;
      }
      this.channelBalance = lndStore.channelBalance.balance;
      this.BTCchannelBalance = lndStore.channelBalance.btc_balance;
      if (this.flgLoading[3] !== 'error') {
        this.flgLoading[3] = ('' !== this.channelBalance) ? false : true;
      }
      this.networkInfo = lndStore.networkInfo;
      if (this.flgLoading[4] !== 'error') {
        this.flgLoading[4] = (undefined !== this.networkInfo.num_nodes) ? false : true;
      }
      this.totalBalances = [...[{'name': 'Local Balance', 'value': +lndStore.totalLocalBalance}, {'name': 'Remote Balance', 'value': +lndStore.totalRemoteBalance}]];
      this.maxBalanceValue = (lndStore.totalLocalBalance > lndStore.totalRemoteBalance) ? lndStore.totalLocalBalance : lndStore.totalRemoteBalance;
      if (lndStore.totalLocalBalance >= 0 && lndStore.totalRemoteBalance >= 0) {
        this.flgTotalCalculated = true;
        if (this.flgLoading[5] !== 'error') {
          this.flgLoading[5] = false;
        }
      }
      this.activeChannels =  lndStore.numberOfActiveChannels;
      this.inactiveChannels = lndStore.numberOfInactiveChannels;
      this.pendingChannels = (undefined !== lndStore.pendingChannels.pending_open_channels) ? lndStore.pendingChannels.pending_open_channels.length : 0;
      if (lndStore.totalLocalBalance >= 0 && lndStore.totalRemoteBalance >= 0 && this.flgLoading[6] !== 'error') {
        this.flgLoading[6] = false;
      }
      this.totalPeers = (lndStore.peers !== null) ? lndStore.peers.length : 0;
      this.logger.info(lndStore);
    });
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe((rtlStore: fromApp.RootState) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchInfo') {
          this.flgLoading[0] = 'error';
        }
        if (effectsErr.action === 'FetchFees') {
          this.flgLoading[1] = 'error';
        }
        if (effectsErr.action === 'FetchBalance/blockchain') {
          this.flgLoading[2] = 'error';
        }
        if (effectsErr.action === 'FetchBalance/channels') {
          this.flgLoading[3] = 'error';
        }
        if (effectsErr.action === 'FetchNetwork') {
          this.flgLoading[4] = 'error';
        }
        if (effectsErr.action === 'FetchChannels/all') {
          this.flgLoading[5] = 'error';
          this.flgLoading[6] = 'error';
        }
      });
      this.selNode = rtlStore.selNode;
      this.logger.info(rtlStore);
    });
  }

  ngOnDestroy() {
    this.unsubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

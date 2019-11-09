import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { LoggerService } from '../../shared/services/logger.service';
import { GetInfo, NetworkInfo, Fees, Peer } from '../../shared/models/lndModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public fees: Fees;
  public information: GetInfo = {};
  public remainder = 0;
  public totalPeers = -1;
  public totalBalance = 0;
  public channelBalance = 0;
  public BTCtotalBalance = 0;
  public BTCchannelBalance = 0;
  public networkInfo: NetworkInfo = {};
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true, true, true]; // 0: Info, 1: Fee, 2: Wallet, 3: Channel, 4: Network
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];
  public channels: any;
  public position = 'below';
  public activeChannels = 0;
  public inactiveChannels = 0;
  public pendingChannels = 0;
  public peers: Peer[] = [];
  barPadding = 0;
  maxBalanceValue = 0;
  totalBalances = [{'name': 'Local Balance', 'value': 0}, {'name': 'Remote Balance', 'value': 0}];
  flgTotalCalculated = false;
  view = [];
  yAxisLabel = 'Balance';
  colorScheme = {domain: ['#FFFFFF']};

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
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
    this.actions$.pipe(takeUntil(this.unsub[0]),
    filter(action => action.type === RTLActions.SET_SELECTED_NODE))
    .subscribe((data) => {
      this.flgTotalCalculated = false;
    });
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[1]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
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
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.information.identity_pubkey) ? false : true;
      }

      this.fees = rtlStore.fees;
      if (this.flgLoading[1] !== 'error') {
        this.flgLoading[1] = (undefined !== this.fees.day_fee_sum) ? false : true;
      }

      this.totalBalance = rtlStore.blockchainBalance.total_balance;
      this.BTCtotalBalance = rtlStore.blockchainBalance.btc_total_balance;
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = (this.totalBalance >= 0) ? false : true;
      }

      this.channelBalance = rtlStore.channelBalance.balance;
      this.BTCchannelBalance = rtlStore.channelBalance.btc_balance;
      if (this.flgLoading[3] !== 'error') {
        this.flgLoading[3] = (this.channelBalance >= 0) ? false : true;
      }

      this.networkInfo = rtlStore.networkInfo;
      if (this.flgLoading[4] !== 'error') {
        this.flgLoading[4] = (undefined !== this.networkInfo.num_nodes) ? false : true;
      }

      if (rtlStore.totalLocalBalance >= 0 && rtlStore.totalRemoteBalance >= 0) {
        this.totalBalances = [{'name': 'Local Balance', 'value': rtlStore.totalLocalBalance}, {'name': 'Remote Balance', 'value': rtlStore.totalRemoteBalance}];
        this.maxBalanceValue = (rtlStore.totalLocalBalance > rtlStore.totalRemoteBalance) ? rtlStore.totalLocalBalance : rtlStore.totalRemoteBalance;
        this.flgTotalCalculated = true;
        if (this.flgLoading[5] !== 'error') {
          this.flgLoading[5] = false;
        }
      }

      this.activeChannels =  rtlStore.numberOfActiveChannels;
      this.inactiveChannels = rtlStore.numberOfInactiveChannels;
      this.pendingChannels = (undefined !== rtlStore.pendingChannels.pending_open_channels) ? rtlStore.pendingChannels.pending_open_channels.length : 0;
      if (rtlStore.totalLocalBalance >= 0 && rtlStore.totalRemoteBalance >= 0 && this.flgLoading[6] !== 'error') {
        this.flgLoading[6] = false;
      }

      this.totalPeers = (rtlStore.peers !== null) ? rtlStore.peers.length : 0;

      this.logger.info(rtlStore);
    });
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

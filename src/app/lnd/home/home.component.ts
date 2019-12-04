import { Component, OnInit, OnDestroy } from '@angular/core';
import { map } from 'rxjs/operators';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faSmile } from '@fortawesome/free-regular-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import { ChannelsStatus, GetInfo, Fees, Peer } from '../../shared/models/lndModels';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';

@Component({
  selector: 'rtl-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  public faSmile = faSmile;
  public flgChildInfoUpdated = false;
  public activeChannels = 0;
  public inactiveChannels = 0;
  public pendingChannels = 0;
  public channelBalances = {localBalance: 0, remoteBalance: 0};
  public selNode: SelNodeChild = {};
  public fees: Fees;
  public information: GetInfo = {};
  public balances = { onchain: 0, lightning: 0 };
  public allChannels = [];
  public flgLoading: Array<Boolean | 'error'> = [true, true, true, true, true, true, true, true]; // 0: Info, 1: Fee, 2: Wallet, 3: Channel, 4: Network
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];
  public channelsStatus: ChannelsStatus = {};
  public peers: Peer[] = [];
  public cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { id: 'node', title: 'Node Details', cols: 10, rows: 1 },
          { id: 'balance', title: 'Balances', cols: 10, rows: 1 },
          { id: 'fee', title: 'Routing Fee Earned', cols: 10, rows: 1 },
          { id: 'status', title: 'Channel Status', cols: 10, rows: 1 },
          { id: 'capacity', title: 'Channel Capacity', cols: 10, rows: 1 }
        ];
      }

      return [
        { id: 'node', title: 'Node Details', cols: 3, rows: 1 },
        { id: 'balance', title: 'Balances', cols: 3, rows: 1 },
        { id: 'capacity', title: 'Channel Capacity', cols: 4, rows: 2 },
        { id: 'fee', title: 'Routing Fee Earned', cols: 3, rows: 1 },
        { id: 'status', title: 'Channel Status', cols: 3, rows: 1 }
      ];
    })
  );    

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private breakpointObserver: BreakpointObserver) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
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
        if (effectsErr.action === 'FetchChannels/all') {
          this.flgLoading[5] = 'error';
        }
        if (effectsErr.action === 'FetchChannels/pending') {
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
      this.balances.onchain = (+rtlStore.blockchainBalance.total_balance >= 0) ? +rtlStore.blockchainBalance.total_balance : 0;
      if (this.flgLoading[2] !== 'error') {
        this.flgLoading[2] = false;
      }

      this.channelBalances = { localBalance: rtlStore.totalLocalBalance, remoteBalance: rtlStore.totalRemoteBalance };
      this.balances.lightning = rtlStore.totalLocalBalance;
      if (this.flgLoading[5] !== 'error') {
        this.flgLoading[5] = false;
      }
      this.balances = Object.assign({}, this.balances);
  
      this.activeChannels =  rtlStore.numberOfActiveChannels;
      this.inactiveChannels = rtlStore.numberOfInactiveChannels;
      this.pendingChannels = (undefined !== rtlStore.pendingChannels.pending_open_channels) ? rtlStore.pendingChannels.pending_open_channels.length : 0;
      this.pendingChannels = this.pendingChannels + ((undefined !== rtlStore.pendingChannels.waiting_close_channels) ? rtlStore.pendingChannels.waiting_close_channels.length : 0);
      this.pendingChannels = this.pendingChannels + ((undefined !== rtlStore.pendingChannels.pending_closing_channels) ? rtlStore.pendingChannels.pending_closing_channels.length : 0);
      this.pendingChannels = this.pendingChannels + ((undefined !== rtlStore.pendingChannels.pending_force_closing_channels) ? rtlStore.pendingChannels.pending_force_closing_channels.length : 0);
      this.channelsStatus = {
        active: { channels: rtlStore.numberOfActiveChannels, capacity: rtlStore.totalCapacityActive },
        inactive: { channels: rtlStore.numberOfInactiveChannels, capacity: rtlStore.totalCapacityInactive },
        pending: { channels: this.pendingChannels, capacity: rtlStore.pendingChannels.total_limbo_balance },
        closed: { channels: (rtlStore.closedChannels && rtlStore.closedChannels.length) ? rtlStore.closedChannels.length : 0, capacity: 0 }
      };
      if (rtlStore.totalLocalBalance >= 0 && rtlStore.totalRemoteBalance >= 0 && this.flgLoading[5] !== 'error') {
        this.flgLoading[5] = false;
      }
      this.allChannels = rtlStore.allChannels.filter(channel => channel.active === true);
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[2]),
    filter((action) => action.type === RTLActions.FETCH_FEES || action.type === RTLActions.SET_FEES))
    .subscribe(action => {
      if(action.type === RTLActions.FETCH_FEES) {
        this.flgChildInfoUpdated = false;
      }
      if(action.type === RTLActions.SET_FEES) {
        this.flgChildInfoUpdated = true;
      }
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

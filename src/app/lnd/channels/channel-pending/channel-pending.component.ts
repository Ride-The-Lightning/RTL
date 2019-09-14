import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Channel, GetInfo, PendingChannels } from '../../../shared/models/lndModels';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-pending',
  templateUrl: './channel-pending.component.html',
  styleUrls: ['./channel-pending.component.scss']
})
export class ChannelPendingComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public selNode: SelNodeChild = {};
  public selectedFilter = 0;
  public information: GetInfo = {};
  public pendingChannels: PendingChannels = {};
  public displayedClosingColumns = [
    'closing_txid',
    'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'
  ];
  public pendingClosingChannelsLength = 0;
  public pendingClosingChannels: any;
  public displayedForceClosingColumns = [
    'closing_txid', 'limbo_balance', 'maturity_height', 'blocks_til_maturity', 'recovered_balance',
    'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'
  ];
  public pendingForceClosingChannelsLength = 0;
  public pendingForceClosingChannels: any;
  public displayedOpenColumns = [
    'commit_weight', 'confirmation_height', 'fee_per_kw', 'commit_fee',
    'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'
  ];
  public pendingOpenChannelsLength = 0;
  public pendingOpenChannels: any;
  public displayedWaitClosingColumns = [
    'limbo_balance',
    'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'
  ];
  public pendingWaitClosingChannelsLength = 0;
  public pendingWaitClosingChannels: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  private unsub: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedClosingColumns = ['remote_node_pub', 'local_balance', 'remote_balance'];
        this.displayedForceClosingColumns = ['remote_node_pub', 'recovered_balance', 'limbo_balance'];
        this.displayedOpenColumns = ['remote_node_pub', 'local_balance', 'commit_fee'];
        this.displayedWaitClosingColumns = ['remote_node_pub', 'limbo_balance', 'local_balance'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedClosingColumns = ['remote_node_pub', 'local_balance', 'remote_balance', 'capacity'];
        this.displayedForceClosingColumns = ['remote_node_pub', 'recovered_balance', 'limbo_balance', 'blocks_til_maturity', 'maturity_height'];
        this.displayedOpenColumns = ['remote_node_pub', 'local_balance', 'commit_fee', 'remote_balance'];
        this.displayedWaitClosingColumns = ['remote_node_pub', 'limbo_balance', 'local_balance', 'remote_balance'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedClosingColumns = ['remote_node_pub', 'local_balance', 'remote_balance', 'capacity', 'closing_txid'];
        this.displayedForceClosingColumns = ['remote_node_pub', 'recovered_balance', 'limbo_balance', 'blocks_til_maturity', 'maturity_height', 'local_balance'];
        this.displayedOpenColumns = ['remote_node_pub', 'local_balance', 'commit_fee', 'remote_balance', 'capacity'];
        this.displayedWaitClosingColumns = ['remote_node_pub', 'limbo_balance', 'local_balance', 'remote_balance', 'capacity', 'channel_point'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.displayedClosingColumns = ['remote_node_pub', 'local_balance', 'remote_balance', 'capacity', 'closing_txid', 'channel_point'];
        this.displayedForceClosingColumns = [
          'remote_node_pub', 'recovered_balance', 'limbo_balance', 'blocks_til_maturity',
          'maturity_height', 'local_balance', 'remote_balance', 'capacity', 'closing_txid', 'channel_point'
        ];
        this.displayedOpenColumns = [
          'remote_node_pub', 'local_balance', 'commit_fee', 'remote_balance', 'capacity', 'commit_weight', 'fee_per_kw', 'confirmation_height', 'channel_point'
        ];
        this.displayedWaitClosingColumns = ['remote_node_pub', 'limbo_balance', 'local_balance', 'remote_balance', 'capacity', 'channel_point'];
        break;
      default:
        this.displayedClosingColumns = ['remote_node_pub', 'local_balance', 'remote_balance', 'capacity', 'closing_txid', 'channel_point'];
        this.displayedForceClosingColumns = [
          'remote_node_pub', 'recovered_balance', 'limbo_balance', 'blocks_til_maturity',
          'maturity_height', 'local_balance', 'remote_balance', 'capacity', 'closing_txid', 'channel_point'
        ];
        this.displayedOpenColumns = [
          'remote_node_pub', 'local_balance', 'commit_fee', 'remote_balance', 'capacity', 'commit_weight', 'fee_per_kw', 'confirmation_height', 'channel_point'
        ];
        this.displayedWaitClosingColumns = ['remote_node_pub', 'limbo_balance', 'local_balance', 'remote_balance', 'capacity', 'channel_point'];
        break;
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels/pending') {
          this.flgLoading[0] = 'error';
        }
      });

      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.pendingChannels = rtlStore.pendingChannels;
      if (undefined !== this.pendingChannels.total_limbo_balance) {
        this.flgLoading[1] = false;
        if (undefined !== this.pendingChannels.pending_closing_channels) {
          this.loadClosingChannelsTable(this.pendingChannels.pending_closing_channels);
        }
        if (undefined !== this.pendingChannels.pending_force_closing_channels) {
          this.loadForceClosingChannelsTable(this.pendingChannels.pending_force_closing_channels);
        }
        if (undefined !== this.pendingChannels.pending_open_channels) {
          this.loadOpenChannelsTable(this.pendingChannels.pending_open_channels);
        }
        if (undefined !== this.pendingChannels.waiting_close_channels) {
          this.loadWaitClosingChannelsTable(this.pendingChannels.waiting_close_channels);
        }
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== this.information.identity_pubkey) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onOpenClick(selRow: any, event: any) {
    const selChannel = this.pendingOpenChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['commit_weight', 'confirmation_height', 'fee_per_kw', 'commit_fee'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const reorderedChannel = {};
    Object.assign(reorderedChannel, fcChannelObj1, fcChannelObj2);
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}));
  }

  onForceClosingClick(selRow: any, event: any) {
    const selChannel = this.pendingForceClosingChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid', 'limbo_balance', 'maturity_height', 'blocks_til_maturity', 'recovered_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const reorderedChannel = {};
    Object.assign(reorderedChannel, fcChannelObj1, fcChannelObj2);
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}));
  }

  onClosingClick(selRow: any, event: any) {
    const selChannel = this.pendingClosingChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const reorderedChannel = {};
    Object.assign(reorderedChannel, fcChannelObj1, fcChannelObj2);
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}));
  }

  onWaitClosingClick(selRow: any, event: any) {
    const selChannel = this.pendingWaitClosingChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['limbo_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const reorderedChannel = {};
    Object.assign(reorderedChannel, fcChannelObj1, fcChannelObj2);
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}));
  }

  loadOpenChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingOpenChannelsLength = (undefined !== channels.length) ? channels.length : 0;
    this.pendingOpenChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingOpenChannels.sort = this.sort;
    this.logger.info(this.pendingOpenChannels);
  }

  loadForceClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingForceClosingChannelsLength = (undefined !== channels.length) ? channels.length : 0;
    this.pendingForceClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingForceClosingChannels.sort = this.sort;
    this.logger.info(this.pendingForceClosingChannels);
  }

  loadClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingClosingChannelsLength = (undefined !== channels.length) ? channels.length : 0;
    this.pendingClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingClosingChannels.sort = this.sort;
    this.logger.info(this.pendingClosingChannels);
  }

  loadWaitClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingWaitClosingChannelsLength = (undefined !== channels.length) ? channels.length : 0;
    this.pendingWaitClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingWaitClosingChannels.sort = this.sort;
    this.logger.info(this.pendingWaitClosingChannels);
  }

  applyFilter(selFilter: number) {
    this.selectedFilter = selFilter;
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

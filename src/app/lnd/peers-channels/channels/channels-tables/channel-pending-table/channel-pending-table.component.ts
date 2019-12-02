import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Channel, GetInfo, PendingChannels } from '../../../../../shared/models/lndModels';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { RTLEffects } from '../../../../../store/rtl.effects';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';
import { AlertTypeEnum, DataTypeEnum } from '../../../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-channel-pending-table',
  templateUrl: './channel-pending-table.component.html',
  styleUrls: ['./channel-pending-table.component.scss']
})
export class ChannelPendingTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public selNode: SelNodeChild = {};
  public selectedFilter = 0;
  public information: GetInfo = {};
  public pendingChannels: PendingChannels = {};
  public displayedOpenColumns = ['channel_point', 'commit_fee', 'commit_weight', 'capacity', 'actions'];
  public pendingOpenChannelsLength = 0;
  public pendingOpenChannels: any;
  public displayedForceClosingColumns = ['channel_point', 'recovered_balance', 'limbo_balance', 'capacity', 'actions'];
  public pendingForceClosingChannelsLength = 0;
  public pendingForceClosingChannels: any;
  public displayedClosingColumns = ['channel_point', 'local_balance', 'remote_balance', 'capacity', 'actions'];
  public pendingClosingChannelsLength = 0;
  public pendingClosingChannels: any;
  public displayedWaitClosingColumns = ['channel_point', 'limbo_balance', 'local_balance', 'remote_balance', 'actions'];
  public pendingWaitClosingChannelsLength = 0;
  public pendingWaitClosingChannels: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedOpenColumns = ['channel_point', 'commit_fee', 'actions'];
        this.displayedForceClosingColumns = ['channel_point', 'limbo_balance', 'actions'];
        this.displayedClosingColumns = ['channel_point', 'capacity', 'actions'];
        this.displayedWaitClosingColumns = ['channel_point', 'limbo_balance', 'actions'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedOpenColumns = ['channel_point', 'commit_fee', 'commit_weight', 'actions'];
        this.displayedForceClosingColumns = ['channel_point', 'recovered_balance', 'limbo_balance', 'actions'];
        this.displayedClosingColumns = ['channel_point', 'local_balance', 'remote_balance', 'actions'];
        this.displayedWaitClosingColumns = ['channel_point', 'limbo_balance', 'capacity', 'actions'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedOpenColumns = ['channel_point', 'commit_fee', 'commit_weight', 'capacity', 'actions'];
        this.displayedForceClosingColumns = ['channel_point', 'recovered_balance', 'limbo_balance', 'capacity', 'actions'];
        this.displayedClosingColumns = ['channel_point', 'local_balance', 'remote_balance', 'capacity', 'actions'];
        this.displayedWaitClosingColumns = ['channel_point', 'limbo_balance', 'local_balance', 'remote_balance', 'actions'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.displayedOpenColumns = ['channel_point', 'commit_fee', 'commit_weight', 'capacity', 'actions'];
        this.displayedForceClosingColumns = ['channel_point', 'recovered_balance', 'limbo_balance', 'capacity', 'actions'];
        this.displayedClosingColumns = ['channel_point', 'local_balance', 'remote_balance', 'capacity', 'actions'];
        this.displayedWaitClosingColumns = ['channel_point', 'limbo_balance', 'local_balance', 'remote_balance', 'actions'];
        break;
      default:
        this.displayedOpenColumns = ['channel_point', 'commit_fee', 'commit_weight', 'capacity', 'actions'];
        this.displayedForceClosingColumns = ['channel_point', 'recovered_balance', 'limbo_balance', 'capacity', 'actions'];
        this.displayedClosingColumns = ['channel_point', 'local_balance', 'remote_balance', 'capacity', 'actions'];
        this.displayedWaitClosingColumns = ['channel_point', 'limbo_balance', 'local_balance', 'remote_balance', 'actions'];
        break;
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels/pending') {
          this.flgLoading[0] = 'error';
        }
      });
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;
      this.pendingChannels = rtlStore.pendingChannels;
      if (this.pendingChannels.total_limbo_balance) {
        this.flgLoading[1] = false;
      }
      if (this.pendingChannels.pending_open_channels) {
        this.loadOpenChannelsTable(this.pendingChannels.pending_open_channels);
      }
      if (this.pendingChannels.pending_force_closing_channels) {
        this.loadForceClosingChannelsTable(this.pendingChannels.pending_force_closing_channels);
      }
      if (this.pendingChannels.pending_closing_channels) {
        this.loadClosingChannelsTable(this.pendingChannels.pending_closing_channels);
      }
      if (this.pendingChannels.waiting_close_channels) {
        this.loadWaitClosingChannelsTable(this.pendingChannels.waiting_close_channels);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (this.information.identity_pubkey) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onOpenClick(selRow: any) {
    const selChannel = this.pendingOpenChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['commit_weight', 'confirmation_height', 'fee_per_kw', 'commit_fee'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel = [
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'confirmation_height', value: preOrderedChannel.confirmation_height, title: 'Confirmation Height', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'fee_per_kw', value: preOrderedChannel.fee_per_kw, title: 'Fee/KW', width: 40, type: DataTypeEnum.NUMBER},
      {key: 'commit_weight', value: preOrderedChannel.commit_weight, title: 'Commit Weight', width: 30, type: DataTypeEnum.NUMBER},
      {key: 'commit_fee', value: preOrderedChannel.commit_fee, title: 'Commit Fee', width: 30, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ width: '55%', data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Opening Channel Information',
      message: reorderedChannel
    }}));
  }

  onForceClosingClick(selRow: any) {
    const selChannel = this.pendingForceClosingChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid', 'limbo_balance', 'maturity_height', 'blocks_til_maturity', 'recovered_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel = [
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'limbo_balance', value: preOrderedChannel.limbo_balance, title: 'Limbo Balance', width: 100, type: DataTypeEnum.NUMBER}],
      [{key: 'closing_txid', value: preOrderedChannel.closing_txid, title: 'Closing Transaction ID', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'maturity_height', value: preOrderedChannel.maturity_height, title: 'Maturity Height', width: 40, type: DataTypeEnum.NUMBER},
        {key: 'blocks_til_maturity', value: preOrderedChannel.blocks_til_maturity, title: 'Blocks Till Maturity', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'recovered_balance', value: preOrderedChannel.recovered_balance, title: 'Recovered Balance', width: 30, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ width: '55%', data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Force Closing Channel Information',
      message: reorderedChannel
    }}));
  }

  onClosingClick(selRow: any) {
    const selChannel = this.pendingClosingChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel = [
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'closing_txid', value: preOrderedChannel.closing_txid, title: 'Closing Transaction ID', width: 50, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ width: '55%', data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Closing Channel Information',
      message: reorderedChannel
    }}));
  }

  onWaitClosingClick(selRow: any) {
    const selChannel = this.pendingWaitClosingChannels.data.filter(channel => {
      return channel.channel.channel_point === selRow.channel.channel_point;
    })[0];
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['limbo_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel = [
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'limbo_balance', value: preOrderedChannel.limbo_balance, title: 'Limbo Balance', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ width: '55%', data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Wait Closing Channel Information',
      message: reorderedChannel
    }}));
  }

  loadOpenChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingOpenChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingOpenChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingOpenChannels.sort = this.sort;
    this.logger.info(this.pendingOpenChannels);
  }

  loadForceClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingForceClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingForceClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingForceClosingChannels.sort = this.sort;
    this.logger.info(this.pendingForceClosingChannels);
  }

  loadClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingClosingChannels.sort = this.sort;
    this.logger.info(this.pendingClosingChannels);
  }

  loadWaitClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingWaitClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingWaitClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingWaitClosingChannels.sort = this.sort;
    this.logger.info(this.pendingWaitClosingChannels);
  }

  applyFilter(selFilter: number) {
    this.selectedFilter = selFilter;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Channel, GetInfo, PendingChannels, PendingOpenChannel } from '../../../../../shared/models/lndModels';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';
import { BumpFeeComponent } from '../../bump-fee-modal/bump-fee.component';

import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';
import { AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-channel-pending-table',
  templateUrl: './channel-pending-table.component.html',
  styleUrls: ['./channel-pending-table.component.scss']
})
export class ChannelPendingTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  public selNode: SelNodeChild = {};
  public selectedFilter = '';
  public information: GetInfo = {};
  public pendingChannels: PendingChannels = {};
  public displayedOpenColumns = ['remote_alias', 'commit_fee', 'commit_weight', 'capacity', 'actions'];
  public pendingOpenChannelsLength = 0;
  public pendingOpenChannels: any;
  public displayedForceClosingColumns = ['remote_alias', 'recovered_balance', 'limbo_balance', 'capacity', 'actions'];
  public pendingForceClosingChannelsLength = 0;
  public pendingForceClosingChannels: any;
  public displayedClosingColumns = ['remote_alias', 'local_balance', 'remote_balance', 'capacity', 'actions'];
  public pendingClosingChannelsLength = 0;
  public pendingClosingChannels: any;
  public displayedWaitClosingColumns = ['remote_alias', 'limbo_balance', 'local_balance', 'remote_balance', 'actions'];
  public pendingWaitClosingChannelsLength = 0;
  public pendingWaitClosingChannels: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.displayedOpenColumns = ['remote_alias', 'actions'];
      this.displayedForceClosingColumns = ['remote_alias', 'actions'];
      this.displayedClosingColumns = ['remote_alias', 'actions'];
      this.displayedWaitClosingColumns = ['remote_alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.displayedOpenColumns = ['remote_alias', 'commit_fee', 'actions'];
      this.displayedForceClosingColumns = ['remote_alias', 'limbo_balance', 'actions'];
      this.displayedClosingColumns = ['remote_alias', 'remote_balance', 'actions'];
      this.displayedWaitClosingColumns = ['remote_alias', 'limbo_balance', 'actions'];
    } else {
      this.displayedOpenColumns = ['remote_alias', 'commit_fee', 'commit_weight', 'capacity', 'actions'];
      this.displayedForceClosingColumns = ['remote_alias', 'recovered_balance', 'limbo_balance', 'capacity', 'actions'];
      this.displayedClosingColumns = ['remote_alias', 'local_balance', 'remote_balance', 'capacity', 'actions'];
      this.displayedWaitClosingColumns = ['remote_alias', 'limbo_balance', 'local_balance', 'remote_balance', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
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
      if (this.pendingChannels.pending_open_channels && this.pendingChannels.pending_open_channels.length && this.pendingChannels.pending_open_channels.length > 0) {
        this.loadOpenChannelsTable(this.pendingChannels.pending_open_channels);
      }
      if (this.pendingChannels.pending_force_closing_channels && this.pendingChannels.pending_force_closing_channels.length && this.pendingChannels.pending_force_closing_channels.length > 0) {
        this.loadForceClosingChannelsTable(this.pendingChannels.pending_force_closing_channels);
      }
      if (this.pendingChannels.pending_closing_channels && this.pendingChannels.pending_closing_channels.length && this.pendingChannels.pending_closing_channels.length > 0) {
        this.loadClosingChannelsTable(this.pendingChannels.pending_closing_channels);
      }
      if (this.pendingChannels.waiting_close_channels && this.pendingChannels.waiting_close_channels.length && this.pendingChannels.waiting_close_channels.length > 0) {
        this.loadWaitClosingChannelsTable(this.pendingChannels.waiting_close_channels);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (this.information.identity_pubkey) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  ngAfterViewInit() {
    if (this.pendingChannels.pending_open_channels && this.pendingChannels.pending_open_channels.length && this.pendingChannels.pending_open_channels.length > 0) {
      this.loadOpenChannelsTable(this.pendingChannels.pending_open_channels);
    }
    if (this.pendingChannels.pending_force_closing_channels && this.pendingChannels.pending_force_closing_channels.length && this.pendingChannels.pending_force_closing_channels.length > 0) {
      this.loadForceClosingChannelsTable(this.pendingChannels.pending_force_closing_channels);
    }
    if (this.pendingChannels.pending_closing_channels && this.pendingChannels.pending_closing_channels.length && this.pendingChannels.pending_closing_channels.length > 0) {
      this.loadClosingChannelsTable(this.pendingChannels.pending_closing_channels);
    }
    if (this.pendingChannels.waiting_close_channels && this.pendingChannels.waiting_close_channels.length && this.pendingChannels.waiting_close_channels.length > 0) {
      this.loadWaitClosingChannelsTable(this.pendingChannels.waiting_close_channels);
    }
  }

  onOpenClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['commit_weight', 'confirmation_height', 'fee_per_kw', 'commit_fee'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel = [
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 25, type: DataTypeEnum.STRING},
        {key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 75, type: DataTypeEnum.STRING}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'confirmation_height', value: preOrderedChannel.confirmation_height, title: 'Confirmation Height', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 25, type: DataTypeEnum.NUMBER}],
      [{key: 'fee_per_kw', value: preOrderedChannel.fee_per_kw, title: 'Fee/KW', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'commit_weight', value: preOrderedChannel.commit_weight, title: 'Commit Weight', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'commit_fee', value: preOrderedChannel.commit_fee, title: 'Commit Fee', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Opening Channel Information',
      message: reorderedChannel
    }}));
  }

  onBumpFee(selChannel: PendingOpenChannel) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      pendingChannel: selChannel,
      component: BumpFeeComponent
    }}));
  }
  
  onForceClosingClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid', 'limbo_balance', 'maturity_height', 'blocks_til_maturity', 'recovered_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel = [
      [{key: 'closing_txid', value: preOrderedChannel.closing_txid, title: 'Closing Transaction ID', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 25, type: DataTypeEnum.STRING},
        {key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 75, type: DataTypeEnum.STRING}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'limbo_balance', value: preOrderedChannel.limbo_balance, title: 'Limbo Balance', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 25, type: DataTypeEnum.NUMBER}],
      [{key: 'maturity_height', value: preOrderedChannel.maturity_height, title: 'Maturity Height', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'blocks_til_maturity', value: preOrderedChannel.blocks_til_maturity, title: 'Blocks Till Maturity', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'recovered_balance', value: preOrderedChannel.recovered_balance, title: 'Recovered Balance', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Force Closing Channel Information',
      message: reorderedChannel
    }}));
  }

  onClosingClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['closing_txid'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2);
    const reorderedChannel = [
      [{key: 'closing_txid', value: preOrderedChannel.closing_txid, title: 'Closing Transaction ID', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 25, type: DataTypeEnum.STRING},
        {key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 75, type: DataTypeEnum.STRING}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Closing Channel Information',
      message: reorderedChannel
    }}));
  }

  onWaitClosingClick(selChannel: any) {
    const fcChannelObj1 = JSON.parse(JSON.stringify(selChannel, ['limbo_balance'], 2));
    const fcChannelObj2 = JSON.parse(JSON.stringify(selChannel.channel, ['remote_alias', 'channel_point', 'remote_balance', 'local_balance', 'remote_node_pub', 'capacity'], 2));
    const fcChannelObj3 = JSON.parse(JSON.stringify(selChannel.commitments, ['local_txid'], 2));
    const preOrderedChannel: any = {};
    Object.assign(preOrderedChannel, fcChannelObj1, fcChannelObj2, fcChannelObj3);
    const reorderedChannel = [
      [{key: 'local_txid', value: preOrderedChannel.local_txid, title: 'Transaction ID', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'channel_point', value: preOrderedChannel.channel_point, title: 'Channel Point', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'remote_alias', value: preOrderedChannel.remote_alias, title: 'Peer Alias', width: 25, type: DataTypeEnum.STRING},
        {key: 'remote_node_pub', value: preOrderedChannel.remote_node_pub, title: 'Peer Node Pubkey', width: 75, type: DataTypeEnum.STRING}],
      [{key: 'capacity', value: preOrderedChannel.capacity, title: 'Capacity', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'limbo_balance', value: preOrderedChannel.limbo_balance, title: 'Limbo Balance', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'local_balance', value: preOrderedChannel.local_balance, title: 'Local Balance', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'remote_balance', value: preOrderedChannel.remote_balance, title: 'Remote Balance', width: 25, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
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
    this.pendingOpenChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.pendingOpenChannels.filterPredicate = (channel: any, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.logger.info(this.pendingOpenChannels);
  }

  loadForceClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingForceClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingForceClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingForceClosingChannels.sort = this.sort;
    this.pendingForceClosingChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.pendingForceClosingChannels.filterPredicate = (channel: any, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.logger.info(this.pendingForceClosingChannels);
  }

  loadClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingClosingChannels.sort = this.sort;
    this.pendingClosingChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.pendingClosingChannels.filterPredicate = (channel: any, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.logger.info(this.pendingClosingChannels);
  }

  loadWaitClosingChannelsTable(channels) {
    channels.sort(function(a, b) {
      return (a.active === b.active) ? 0 : ((b.active) ? -1 : 1);
    });
    this.pendingWaitClosingChannelsLength = (channels.length) ? channels.length : 0;
    this.pendingWaitClosingChannels = new MatTableDataSource<Channel>([...channels]);
    this.pendingWaitClosingChannels.sort = this.sort;
    this.pendingWaitClosingChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.pendingWaitClosingChannels.filterPredicate = (channel: any, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.logger.info(this.pendingWaitClosingChannels);
  }

  applyFilter(selFilter: string) {
    this.selectedFilter = selFilter.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

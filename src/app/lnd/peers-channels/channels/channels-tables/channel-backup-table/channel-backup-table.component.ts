import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { Channel } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-backup-table',
  templateUrl: './channel-backup-table.component.html',
  styleUrls: ['./channel-backup-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]  
})
export class ChannelBackupTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public selNode: SelNodeChild = {};
  public displayedColumns = ['channel_point', 'actions'];
  public selChannel: Channel;
  public channels: any;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: channels
  public flgSticky = false;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'Fetchchannels') {
          this.flgLoading[0] = 'error';
        }
      });
      this.channels = new MatTableDataSource([]);
      this.channels.data = [];
      if (undefined !== rtlStore.allChannels) {
        this.channels = new MatTableDataSource<Channel>([...rtlStore.allChannels]);
        this.channels.data = rtlStore.allChannels;
      }
      this.channels.sort = this.sort;
      this.channels.paginator = this.paginator;
      this.channels.filterPredicate = (channel: Channel, fltr: string) => {
        const newChannel = ((channel.active) ? 'active' : 'inactive') + (channel.channel_point ? channel.channel_point : '') + (channel.chan_id ? channel.chan_id : '') +
        (channel.remote_pubkey ? channel.remote_pubkey : '') + (channel.remote_alias ? channel.remote_alias : '') +
        (channel.capacity ? channel.capacity : '') + (channel.local_balance ? channel.local_balance : '') +
        (channel.remote_balance ? channel.remote_balance : '') + (channel.total_satoshis_sent ? channel.total_satoshis_sent : '') +
        (channel.total_satoshis_received ? channel.total_satoshis_received : '') + (channel.commit_fee ? channel.commit_fee : '') +
        (channel.private ? 'private' : 'public');
        return newChannel.includes(fltr);
      };
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === RTLActions.SET_ALL_CHANNELS)
    ).subscribe((setchannels: RTLActions.SetAllChannels) => {
      this.selChannel = undefined;
    });
  }

  onBackupChannels(selChannel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Backup Channels...'));
    this.store.dispatch(new RTLActions.BackupChannels({channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL', showMessage: ''}));
  }

  onVerifyChannels(selChannel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Verify Channels...'));
    this.store.dispatch(new RTLActions.VerifyChannels({channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL'}));
  }

  onChannelClick(selRow: Channel, event: any) {
    const flgButtonsClicked = event.target.className.includes('mat-icon')
      || event.target.className.includes('mat-column-backup')
      || event.target.className.includes('mat-column-verify');
    if (flgButtonsClicked) { return; }
    const selChannel = this.channels.data.filter(channel => {
      return channel.chan_id === selRow.chan_id;
    })[0];
    const reorderedChannel = [
      [{key: 'remote_alias', value: selChannel.remote_alias, title: 'Peer Alias', width: 40},
        {key: 'active', value: selChannel.active, title: 'Active', width: 30, type: DataTypeEnum.BOOLEAN},
        {key: 'private', value: selChannel.private, title: 'Private', width: 30, type: DataTypeEnum.BOOLEAN}],
      [{key: 'remote_pubkey', value: selChannel.remote_pubkey, title: 'Peer Public Key', width: 100}],
      [{key: 'channel_point', value: selChannel.channel_point, title: 'Channel Point', width: 100}],
      [{key: 'chan_id', value: selChannel.chan_id, title: 'Channel ID', width: 50},
        {key: 'capacity', value: selChannel.capacity, title: 'Capacity', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'local_balance', value: selChannel.local_balance, title: 'Local Balance', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'remote_balance', value: selChannel.remote_balance, title: 'Remote Balance', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'commit_fee', value: selChannel.commit_fee, title: 'Commit Fee', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'commit_weight', value: selChannel.commit_weight, title: 'Commit Weight', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'fee_per_kw', value: selChannel.fee_per_kw, title: 'Fee/KW', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'unsettled_balance', value: selChannel.unsettled_balance, title: 'Unsettled Balance', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'total_satoshis_sent', value: selChannel.total_satoshis_sent, title: 'Total Satoshis Sent', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'total_satoshis_received', value: selChannel.total_satoshis_received, title: 'Total Satoshis Received', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'num_updates', value: selChannel.num_updates, title: 'Number of Updates', width: 40, type: DataTypeEnum.NUMBER},
        {key: 'pending_htlcs', value: selChannel.pending_htlcs, title: 'Pending HTLCs', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'csv_delay', value: selChannel.csv_delay, title: 'CSV Delay', width: 30, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'channel Information',
      message: reorderedChannel
    }}));
  }

  applyFilter(selFilter: string) {
    this.channels.filter = selFilter;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

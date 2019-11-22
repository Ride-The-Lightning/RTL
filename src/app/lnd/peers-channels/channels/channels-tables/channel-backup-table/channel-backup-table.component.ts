import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { Channel } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../../../shared/models/enums';
import { getPaginatorLabel } from '../../../../../shared/services/paginator.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { RTLEffects } from '../../../../../store/rtl.effects';
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
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private actions$: Actions, private router: Router) {}

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
      filter((action) => action.type === RTLActions.SET_CHANNELS)
    ).subscribe((setchannels: RTLActions.SetChannels) => {
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
    const reorderedChannel = JSON.parse(JSON.stringify(selChannel, [
      'active', 'remote_pubkey', 'remote_alias', 'channel_point', 'chan_id', 'capacity', 'local_balance', 'remote_balance', 'commit_fee', 'commit_weight',
      'fee_per_kw', 'unsettled_balance', 'total_satoshis_sent', 'total_satoshis_received', 'num_updates', 'pending_htlcs', 'csv_delay', 'private'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ config: { width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
    }}}));
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

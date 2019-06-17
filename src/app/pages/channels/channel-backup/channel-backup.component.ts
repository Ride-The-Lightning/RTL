import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Channel } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLEffects } from '../../../shared/store/rtl.effects';
import * as RTLActions from '../../../shared/store/rtl.actions';
import * as fromRTLReducer from '../../../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-channel-backup',
  templateUrl: './channel-backup.component.html',
  styleUrls: ['./channel-backup.component.scss']
})
export class ChannelBackupComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort: MatSort;
  public displayedColumns = ['chan_id', 'backup', 'verify'];
  public selChannel: Channel;
  public channels: any;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: channels
  public flgSticky = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.State>, private rtlEffects: RTLEffects, private actions$: Actions, private router: Router) {}

  ngOnInit() {
    this.store.select('rtlRoot')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore: fromRTLReducer.State) => {
      rtlStore.effectErrors.forEach(effectsErr => {
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
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedChannel)
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

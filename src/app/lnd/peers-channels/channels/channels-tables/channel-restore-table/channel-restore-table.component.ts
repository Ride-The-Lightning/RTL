import { Component, OnInit, ViewChild } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { SelNodeChild } from '../../../../../shared/models/RTLconfig';
import { Channel } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../../../shared/models/enums';
import { getPaginatorLabel } from '../../../../../shared/services/paginator.service';
import { LoggerService } from '../../../../../shared/services/logger.service';

import { LNDEffects } from '../../../../store/lnd.effects';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-restore-table',
  templateUrl: './channel-restore-table.component.html',
  styleUrls: ['./channel-restore-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ChannelRestoreTableComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public selNode: SelNodeChild = {};
  public displayedColumns = ['channel_point', 'actions'];
  public selChannel: Channel;
  public channels: any;
  public allRestoreExists = false;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: channels
  public flgSticky = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects) {}

  ngOnInit() {
    this.store.dispatch(new RTLActions.RestoreChannelsList());
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.logger.info(rtlStore);
    });    
    this.lndEffects.setRestoreChannelList
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((resRCList) => {
      this.allRestoreExists = resRCList.all_restore_exists;
      this.channels = new MatTableDataSource([...resRCList.files]);
      this.channels.data = resRCList.files;
      this.channels.sort = this.sort;
      this.channels.paginator = this.paginator;
      console.warn(this.channels);
      if (this.flgLoading[0] !== 'error' || (resRCList && resRCList.files)) {
        this.flgLoading[0] = false;
      }
      this.logger.info(resRCList);
    });
  }

  onRestoreChannels(selChannel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Restoring Channels...'));
    this.store.dispatch(new RTLActions.RestoreChannels({channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL'}));
  }  

  applyFilter(selFilter: string) {
    this.channels.filter = selFilter;
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

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

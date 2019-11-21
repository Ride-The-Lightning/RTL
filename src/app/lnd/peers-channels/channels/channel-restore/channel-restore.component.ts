import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';
import { Channel } from '../../../../shared/models/lndModels';
import { LoggerService } from '../../../../shared/services/logger.service';

import { LNDEffects } from '../../../store/lnd.effects';
import { RTLEffects } from '../../../../store/rtl.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-restore',
  templateUrl: './channel-restore.component.html',
  styleUrls: ['./channel-restore.component.scss']
})
export class ChannelRestoreComponent implements OnInit {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public selNode: SelNodeChild = {};
  public displayedColumns = ['chan_point', 'restore'];
  public selChannel: Channel;
  public channels: any;
  public allRestoreExists = false;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: channels
  public flgSticky = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private actions$: Actions) {}

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

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

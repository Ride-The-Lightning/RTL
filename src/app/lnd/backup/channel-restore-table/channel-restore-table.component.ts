import { Component, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { Channel } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { LNDEffects } from '../../store/lnd.effects';
import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

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
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.dispatch(new LNDActions.RestoreChannelsList());
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
      if (this.flgLoading[0] !== 'error' || (resRCList && resRCList.files)) {
        this.flgLoading[0] = false;
      }
      this.logger.info(resRCList);
    });
  }

  onRestoreChannels(selChannel: Channel) {
    this.store.dispatch(new RTLActions.OpenSpinner('Restoring Channels...'));
    this.store.dispatch(new LNDActions.RestoreChannels({channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL'}));
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

import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { RTLState } from '../../../store/rtl.state';
import { restoreChannels, restoreChannelsList } from '../../store/lnd.actions';
import { lndNodeSettings } from '../../store/lnd.selector';

@Component({
  selector: 'rtl-channel-restore-table',
  templateUrl: './channel-restore-table.component.html',
  styleUrls: ['./channel-restore-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ChannelRestoreTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public selNode: SelNodeChild = {};
  public displayedColumns = ['channel_point', 'actions'];
  public selChannel: Channel;
  public channelsData = [];
  public channels: any;
  public allRestoreExists = false;
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: channels
  public flgSticky = false;
  public selFilter = '';
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private lndEffects: LNDEffects, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.dispatch(restoreChannelsList());
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => { this.selNode = nodeSettings; });
    this.lndEffects.setRestoreChannelList.pipe(takeUntil(this.unSubs[1])).
      subscribe((resRCList) => {
        this.allRestoreExists = resRCList.all_restore_exists;
        this.channelsData = resRCList.files;
        if (this.channelsData.length > 0) {
          this.loadRestoreTable(this.channelsData);
        }
        if (this.flgLoading[0] !== 'error' || (resRCList && resRCList.files)) {
          this.flgLoading[0] = false;
        }
        this.logger.info(resRCList);
      });
  }

  ngAfterViewInit() {
    if (this.channelsData && this.channelsData.length > 0) {
      this.loadRestoreTable(this.channelsData);
    }
  }

  onRestoreChannels(selChannel: Channel) {
    this.store.dispatch(restoreChannels({ payload: { channelPoint: (selChannel.channel_point) ? selChannel.channel_point : 'ALL' } }));
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  loadRestoreTable(channels: any[]) {
    this.channels = new MatTableDataSource([...channels]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.channels.filterPredicate = (channel: Channel, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.channels.paginator = this.paginator;
    this.applyFilter();
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

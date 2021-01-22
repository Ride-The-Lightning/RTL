import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ClosedChannel } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CHANNEL_CLOSURE_TYPE } from '../../../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-channel-closed-table',
  templateUrl: './channel-closed-table.component.html',
  styleUrls: ['./channel-closed-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ChannelClosedTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public channelClosureType = CHANNEL_CLOSURE_TYPE;
  public faHistory = faHistory;
  public displayedColumns: any[] = [];
  public closedChannelsData: ClosedChannel[] =[];
  public closedChannels: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['remote_alias', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['close_type', 'remote_alias', 'settled_balance', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['close_type', 'remote_alias', 'capacity', 'close_height', 'settled_balance', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels/closed') {
          this.flgLoading[0] = 'error';
        }
      });
      this.closedChannelsData = rtlStore.closedChannels;
      if (this.closedChannelsData.length > 0) {
        this.loadClosedChannelsTable(this.closedChannelsData);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.closedChannels) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.closedChannelsData.length > 0) {
      this.loadClosedChannelsTable(this.closedChannelsData);
    }
  }

  applyFilter(selFilter: any) {
    this.closedChannels.filter = selFilter.value.trim().toLowerCase();
  }

  onClosedChannelClick(selChannel: ClosedChannel, event: any) {
    const reorderedChannel = [
      [{key: 'close_type', value: this.channelClosureType[selChannel.close_type].name, title: 'Close Type', width: 30, type: DataTypeEnum.STRING},
        {key: 'settled_balance', value: selChannel.settled_balance, title: 'Settled Balance', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'time_locked_balance', value: selChannel.time_locked_balance, title: 'Time Locked Balance', width: 40, type: DataTypeEnum.NUMBER}],
      [{key: 'chan_id', value: selChannel.chan_id, title: 'Channel ID', width: 30},
        {key: 'capacity', value: selChannel.capacity, title: 'Capacity', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'close_height', value: selChannel.close_height, title: 'Close Height', width: 40, type: DataTypeEnum.NUMBER}],
      [{key: 'remote_alias', value: selChannel.remote_alias, title: 'Peer Alias', width: 30},
        {key: 'remote_pubkey', value: selChannel.remote_pubkey, title: 'Peer Public Key', width: 70}],
      [{key: 'channel_point', value: selChannel.channel_point, title: 'Channel Point', width: 100}],
      [{key: 'closing_tx_hash', value: selChannel.closing_tx_hash, title: 'Closing Transaction Hash', width: 100, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Closed Channel Information',
      message: reorderedChannel
    }}));
  }

  loadClosedChannelsTable(closedChannels) {
    this.closedChannels = new MatTableDataSource<ClosedChannel>([...closedChannels]);
    this.closedChannels.sort = this.sort;
    this.closedChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.closedChannels.filterPredicate = (channel: ClosedChannel, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.closedChannels.paginator = this.paginator;
    this.logger.info(this.closedChannels);
  }

  onDownloadCSV() {
    if(this.closedChannels.data && this.closedChannels.data.length > 0) {
      this.commonService.downloadFile(this.closedChannels.data, 'Closed-channels');
    }
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

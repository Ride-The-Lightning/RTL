import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { ClosedChannel, ChannelCloseSummaryClosureType } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../../../shared/services/consts-enums-functions';
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
export class ChannelClosedTableComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  public channelCloseSummaryClosureType = ChannelCloseSummaryClosureType;
  public faHistory = faHistory;
  public displayedColumns = [];
  public closedChannels: any;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public selectedFilter = '';
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
      this.displayedColumns = ['chan_id', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['close_type', 'chan_id', 'settled_balance', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['close_type', 'chan_id', 'capacity', 'close_height', 'settled_balance', 'actions'];
    }
  }

  ngOnInit() {
    this.actions$.pipe(takeUntil(this.unsub[2]), filter((action) => action.type === RTLActions.RESET_LND_STORE)).subscribe((resetLndStore: RTLActions.ResetLNDStore) => {
      this.store.dispatch(new RTLActions.FetchClosedChannels());
    });
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchChannels/closed') {
          this.flgLoading[0] = 'error';
        }
      });
      if ( rtlStore.closedChannels) {
        this.loadClosedChannelsTable(rtlStore.closedChannels);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.closedChannels) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  applyFilter(selFilter: string) {
    this.selectedFilter = selFilter;
    this.closedChannels.filter = selFilter;
  }

  onClosedChannelClick(selChannel: ClosedChannel, event: any) {
    const reorderedChannel = [
      [{key: 'close_type', value: selChannel.close_type, title: 'Close Type', width: 40, type: DataTypeEnum.STRING},
        {key: 'time_locked_balance', value: selChannel.time_locked_balance, title: 'Time Locked Balance', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'settled_balance', value: selChannel.settled_balance, title: 'Settled Balance', width: 30, type: DataTypeEnum.NUMBER}],
      [{key: 'remote_pubkey', value: selChannel.remote_pubkey, title: 'Peer Public Key', width: 100}],
      [{key: 'channel_point', value: selChannel.channel_point, title: 'Channel Point', width: 100}],
      [{key: 'chan_id', value: selChannel.chan_id, title: 'Channel ID', width: 40},
        {key: 'capacity', value: selChannel.capacity, title: 'capacity', width: 30, type: DataTypeEnum.NUMBER},
        {key: 'close_height', value: selChannel.close_height, title: 'Close Height', width: 30, type: DataTypeEnum.NUMBER}],
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
    this.closedChannels.paginator = this.paginator;
    this.logger.info(this.closedChannels);
  }

  resetData() {
    this.selectedFilter = '';
  }

  onDownloadCSV() {
    if(this.closedChannels.data && this.closedChannels.data.length > 0) {
      this.commonService.downloadCSV(this.closedChannels.data, 'Closed-channels');
    }
  }

  ngOnDestroy() {
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faHistory } from '@fortawesome/free-solid-svg-icons';

import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ClosedChannel } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, CHANNEL_CLOSURE_TYPE, APICallStatusEnum, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { openAlert } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { closedChannels, lndPageSettings } from '../../../../store/lnd.selector';
import { PageSettings, TableSetting } from '../../../../../shared/models/pageSettings';

@Component({
  selector: 'rtl-channel-closed-table',
  templateUrl: './channel-closed-table.component.html',
  styleUrls: ['./channel-closed-table.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Channels') }
  ]
})
export class ChannelClosedTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'closed', recordsPerPage: PAGE_SIZE, sortBy: 'close_type', sortOrder: SortOrderEnum.DESCENDING };
  public channelClosureType = CHANNEL_CLOSURE_TYPE;
  public faHistory = faHistory;
  public displayedColumns: any[] = [];
  public closedChannelsData: ClosedChannel[] = [];
  public closedChannels: any = new MatTableDataSource([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private commonService: CommonService) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(closedChannels).pipe(takeUntil(this.unSubs[1])).
      subscribe((closedChannelsSelector: { closedChannels: ClosedChannel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = closedChannelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.closedChannelsData = closedChannelsSelector.closedChannels;
        if (this.closedChannelsData.length > 0) {
          this.loadClosedChannelsTable(this.closedChannelsData);
        }
        this.logger.info(closedChannelsSelector);
      });
  }

  ngAfterViewInit() {
    if (this.closedChannelsData.length > 0) {
      this.loadClosedChannelsTable(this.closedChannelsData);
    }
  }

  applyFilter() {
    this.closedChannels.filter = this.selFilter.trim().toLowerCase();
  }

  onClosedChannelClick(selChannel: ClosedChannel, event: any) {
    const reorderedChannel = [
      [{ key: 'close_type', value: this.channelClosureType[selChannel.close_type].name, title: 'Close Type', width: 30, type: DataTypeEnum.STRING },
      { key: 'settled_balance', value: selChannel.settled_balance, title: 'Settled Balance', width: 30, type: DataTypeEnum.NUMBER },
      { key: 'time_locked_balance', value: selChannel.time_locked_balance, title: 'Time Locked Balance', width: 40, type: DataTypeEnum.NUMBER }],
      [{ key: 'chan_id', value: selChannel.chan_id, title: 'Channel ID', width: 30 },
      { key: 'capacity', value: selChannel.capacity, title: 'Capacity', width: 30, type: DataTypeEnum.NUMBER },
      { key: 'close_height', value: selChannel.close_height, title: 'Close Height', width: 40, type: DataTypeEnum.NUMBER }],
      [{ key: 'remote_alias', value: selChannel.remote_alias, title: 'Peer Alias', width: 30 },
      { key: 'remote_pubkey', value: selChannel.remote_pubkey, title: 'Peer Public Key', width: 70 }],
      [{ key: 'channel_point', value: selChannel.channel_point, title: 'Channel Point', width: 100 }],
      [{ key: 'closing_tx_hash', value: selChannel.closing_tx_hash, title: 'Closing Transaction Hash', width: 100, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Closed Channel Information',
          message: reorderedChannel
        }
      }
    }));
  }

  loadClosedChannelsTable(closedChannels) {
    this.closedChannels = new MatTableDataSource<ClosedChannel>([...closedChannels]);
    this.closedChannels.sort = this.sort;
    this.closedChannels.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.closedChannels.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.closedChannels.filterPredicate = (channel: ClosedChannel, fltr: string) => JSON.stringify(channel).toLowerCase().includes(fltr);
    this.closedChannels.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.closedChannels);
  }

  onDownloadCSV() {
    if (this.closedChannels.data && this.closedChannels.data.length > 0) {
      this.commonService.downloadFile(this.closedChannels.data, 'Closed-channels');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

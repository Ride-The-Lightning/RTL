import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

import { ChannelInformationComponent } from '../../channel-information-modal/channel-information.component';
import { Channel, ChannelHTLC, ChannelsSummary, LightningBalance } from '../../../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { openAlert } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { channels, lndPageSettings } from '../../../../store/lnd.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../../shared/pipes/app.pipe';
import { MessageDataField } from '../../../../../shared/models/alertData';

@Component({
  selector: 'rtl-channel-active-htlcs-table',
  templateUrl: './channel-active-htlcs-table.component.html',
  styleUrls: ['./channel-active-htlcs-table.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('HTLCs') }
  ]
})
export class ChannelActiveHTLCsTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'active_HTLCs', recordsPerPage: PAGE_SIZE, sortBy: 'expiration_height', sortOrder: SortOrderEnum.DESCENDING };
  public channels: any = new MatTableDataSource([]);
  public channelsJSONArr: Channel[] = [];
  public displayedColumns: any[] = [];
  public htlcColumns = [];
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public selFilter = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
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
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 14) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.channelsJSONArr = channelsSelector.channels?.filter((channel) => channel.pending_htlcs && channel.pending_htlcs.length > 0) || [];
        if (this.channelsJSONArr && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadHTLCsTable(this.channelsJSONArr);
        }
        this.logger.info(channelsSelector);
      });
  }

  ngAfterViewInit() {
    if (this.channelsJSONArr.length > 0) {
      this.loadHTLCsTable(this.channelsJSONArr);
    }
  }

  onHTLCClick(selHtlc: ChannelHTLC, selChannel: Channel) {
    const reorderedHTLC: MessageDataField[][] = [
      [{ key: 'remote_alias', value: selChannel.remote_alias, title: 'Alias', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'amount', value: selHtlc.amount, title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'incoming', value: (selHtlc.incoming ? 'Yes' : 'No'), title: 'Incoming', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'expiration_height', value: selHtlc.expiration_height, title: 'Expiration Height', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'hash_lock', value: selHtlc.hash_lock, title: 'Hash Lock', width: 50, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'HTLC Information',
          message: reorderedHTLC
        }
      }
    }));
  }

  onChannelClick(selChannel: Channel, event: any) {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          channel: selChannel,
          showCopy: true,
          component: ChannelInformationComponent
        }
      }
    }));
  }

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.channels.filterPredicate = (rowData: Channel, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = (rowData.remote_alias ? rowData.remote_alias.toLowerCase() : '') +
          rowData.pending_htlcs?.map((htlc) => JSON.stringify(htlc) + (htlc.incoming ? 'yes' : 'no'));
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  loadHTLCsTable(channels: Channel[]) {
    this.channels = (channels) ? new MatTableDataSource<Channel>([...channels]) : new MatTableDataSource([]);
    this.channels.sort = this.sort;
    this.channels.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'amount':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'number', this.sort?.direction);
          return data.pending_htlcs && data.pending_htlcs.length ? data.pending_htlcs.length : null;

        case 'incoming':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'boolean', this.sort?.direction);
          return data.remote_alias ? data.remote_alias : data.remote_pubkey ? data.remote_pubkey : null;

        case 'expiration_height':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'number', this.sort?.direction);
          return data;

        case 'hash_lock':
          this.commonService.sortByKey(data.pending_htlcs, sortHeaderId, 'number', this.sort?.direction);
          return data;

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.channels.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
  }

  onDownloadCSV() {
    if (this.channels.data && this.channels.data.length > 0) {
      this.commonService.downloadFile(this.flattenHTLCs(), 'ActiveHTLCs');
    }
  }

  flattenHTLCs() {
    const channelsDataCopy = JSON.parse(JSON.stringify(this.channels.data));
    const flattenedHTLCs = channelsDataCopy?.reduce((acc, curr) => {
      if (curr.pending_htlcs) {
        return acc.concat(curr.pending_htlcs);
      } else {
        return acc.concat(curr);
      }
    }, []);
    return flattenedHTLCs;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Channel, ChannelHTLC } from '../../../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../../../shared/services/logger.service';
import { CommonService } from '../../../../../shared/services/common.service';

import { openAlert } from '../../../../../store/rtl.actions';
import { RTLState } from '../../../../../store/rtl.state';
import { clnPageSettings, channels } from '../../../../store/cln.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../../../shared/pipes/app.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'rtl-cln-channel-active-htlcs-table',
  templateUrl: './channel-active-htlcs-table.component.html',
  styleUrls: ['./channel-active-htlcs-table.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('HTLCs') }
  ]
})
export class CLNChannelActiveHTLCsTableComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'peers_channels';
  public tableSetting: TableSetting = { tableId: 'active_HTLCs', recordsPerPage: PAGE_SIZE, sortBy: 'expiry', sortOrder: SortOrderEnum.DESCENDING };
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
    this.store.select(clnPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || CLN_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
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
      subscribe((channelsSelector: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = channelsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        const allChannels = [...channelsSelector.activeChannels, ...channelsSelector.pendingChannels, ...channelsSelector.inactiveChannels];
        this.channelsJSONArr = allChannels?.filter((channel) => channel.htlcs && channel.htlcs.length > 0) || [];
        if (this.channelsJSONArr.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0) {
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
    const reorderedHTLC = [
      [{ key: 'alias', value: selChannel.alias, title: 'Alias', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'amount_msat', value: ((selHtlc.amount_msat || 0) / 1000), title: 'Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'direction', value: this.commonService.titleCase(selHtlc.direction || ''), title: 'Direction', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'expiry', value: selHtlc.expiry, title: 'Expiry', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'state', value: this.camelCaseWithReplace.transform((selHtlc.state || '') || '', '_'), title: 'State', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'id', value: selHtlc.id, title: 'HTLC ID', width: 50, type: DataTypeEnum.STRING },
      { key: 'local_trimmed', value: selHtlc.local_trimmed, title: 'Local Trimmed', width: 50, type: DataTypeEnum.BOOLEAN }],
      [{ key: 'payment_hash', value: selHtlc.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }]
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

  applyFilter() {
    this.channels.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform((returnColumn.column || ''), '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.channels.filterPredicate = (rowData: Channel, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = (rowData.alias ? rowData.alias.toLowerCase() : '') +
          rowData.htlcs?.map((htlc) => JSON.stringify(htlc).toLowerCase() + (htlc.local_trimmed ? ' yes ' : ' no '));
          break;

        case 'direction':
          rowToFilter = rowData.htlcs?.map((htlc) => htlc.direction + ' ').toString() || '';
          break;

        case 'id':
          rowToFilter = rowData.htlcs?.map((htlc) => htlc.id + ' ').toString() || '';
          break;

        case 'expiry':
          rowToFilter = rowData.htlcs?.map((htlc) => htlc.expiry + ' ').toString() || '';
          break;

        case 'state':
          rowToFilter = rowData.htlcs?.map((htlc) => this.camelCaseWithReplace.transform((htlc.state || '') || '', '_').toLowerCase() + ' ').toString() || '';
          break;

        case 'payment_hash':
          rowToFilter = rowData.htlcs?.map((htlc) => htlc.payment_hash + ' ').toString() || '';
          break;

        case 'local_trimmed':
          rowToFilter = rowData.htlcs?.map((htlc) => (htlc.local_trimmed ? ' yes ' : ' no ')).toString() || '';
          break;

        case 'amount_msat':
          rowToFilter = (rowData.htlcs?.map((htlc) => (htlc.amount_msat || 0) / 1000))?.toString() || '';
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
        case 'amount_msat':
          this.commonService.sortByKey(data.htlcs, sortHeaderId, 'number', this.sort?.direction);
          return data.htlcs && data.htlcs.length ? data.htlcs.length : null;

        case 'id':
          this.commonService.sortByKey(data.htlcs, sortHeaderId, 'string', this.sort?.direction);
          return data;

        case 'direction':
          this.commonService.sortByKey(data.htlcs, sortHeaderId, 'string', this.sort?.direction);
          return data.alias ? data.alias : data.id ? data.id : null;

        case 'expiry':
          this.commonService.sortByKey(data.htlcs, sortHeaderId, 'number', this.sort?.direction);
          return data;

        case 'payment_hash':
          this.commonService.sortByKey(data.htlcs, sortHeaderId, 'string', this.sort?.direction);
          return data;

        case 'state':
          this.commonService.sortByKey(data.htlcs, sortHeaderId, 'string', this.sort?.direction);
          return data;

        case 'local_trimmed':
          this.commonService.sortByKey(data.htlcs, sortHeaderId, 'boolean', this.sort?.direction);
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
      if (curr.htlcs) {
        return acc.concat(curr.htlcs);
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

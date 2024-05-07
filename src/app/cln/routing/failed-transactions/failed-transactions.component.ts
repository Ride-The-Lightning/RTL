import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

import { ForwardingEvent, ListForwards } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, CLNForwardingEventsStatusEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getForwardingHistory } from '../../store/cln.actions';
import { clnPageSettings, failedForwardingHistory } from '../../store/cln.selector';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';
import { MessageDataField } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-cln-failed-history',
  templateUrl: './failed-transactions.component.html',
  styleUrls: ['./failed-transactions.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Failed events') }
  ]
})
export class CLNFailedTransactionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'routing';
  public tableSetting: TableSetting = { tableId: 'failed', recordsPerPage: PAGE_SIZE, sortBy: 'received_time', sortOrder: SortOrderEnum.DESCENDING };
  public faExclamationTriangle = faExclamationTriangle;
  public failedEvents: any[] = [];
  public errorMessage = '';
  public displayedColumns: any[] = [];
  public failedForwardingEvents: any = new MatTableDataSource([]);
  public selFilter = '';
  public totalFailedTransactions = 0;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.dispatch(getForwardingHistory({ payload: { status: CLNForwardingEventsStatusEnum.FAILED } }));
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
    this.store.select(failedForwardingHistory).pipe(takeUntil(this.unSubs[1])).
      subscribe((ffhSeletor: { failedForwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = ffhSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.totalFailedTransactions = ffhSeletor.failedForwardingHistory.totalForwards || 0;
        this.failedEvents = ffhSeletor.failedForwardingHistory.listForwards || [];
        if (this.failedEvents && this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadFailedEventsTable(this.failedEvents);
        }
        this.logger.info(ffhSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.failedEvents.length > 0) {
      this.loadFailedEventsTable(this.failedEvents);
    }
  }

  onFailedEventClick(selFEvent: ForwardingEvent) {
    const reorderedFHEvent: MessageDataField[][] = [
      [{ key: 'received_time', value: selFEvent.received_time, title: 'Received Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'resolved_time', value: selFEvent.resolved_time, title: 'Resolved Time', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'in_channel_alias', value: selFEvent.in_channel_alias, title: 'Inbound Channel', width: 50, type: DataTypeEnum.STRING },
      { key: 'out_channel_alias', value: selFEvent.out_channel_alias, title: 'Outbound Channel', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'in_msatoshi', value: selFEvent.in_msat, title: 'Amount In (mSats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'out_msatoshi', value: selFEvent.out_msat, title: 'Amount Out (mSats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'fee', value: selFEvent.fee_msat, title: 'Fee (mSats)', width: 34, type: DataTypeEnum.NUMBER }]
    ];
    if (selFEvent.payment_hash) {
      reorderedFHEvent?.unshift([{ key: 'payment_hash', value: selFEvent.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Failed Event Information',
          message: reorderedFHEvent
        }
      }
    }));
  }

  applyFilter() {
    this.failedForwardingEvents.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.failedForwardingEvents.filterPredicate = (rowData: ForwardingEvent, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = (rowData.received_time ? this.datePipe.transform(new Date(rowData.received_time * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() + ' ' : '') +
          (rowData.resolved_time ? this.datePipe.transform(new Date(rowData.resolved_time * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() + ' ' : '') +
          (rowData.in_channel ? rowData.in_channel.toLowerCase() + ' ' : '') + (rowData.out_channel ? rowData.out_channel.toLowerCase() + ' ' : '') +
          (rowData.in_channel_alias ? rowData.in_channel_alias.toLowerCase() + ' ' : '') + (rowData.out_channel_alias ? rowData.out_channel_alias.toLowerCase() + ' ' : '') +
          (rowData.fee_msat ? rowData.fee_msat + ' ' : '') + (rowData.in_msat ? (+rowData.in_msat / 1000) + ' ' : '') + (rowData.out_msat ? (+rowData.out_msat / 1000) + ' ' : '') + (rowData.fee_msat ? rowData.fee_msat + ' ' : '');
          break;

        case 'received_time':
        case 'resolved_time':
          rowToFilter = this.datePipe.transform(new Date((rowData[this.selFilterBy] || 0) * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        case 'fee':
          rowToFilter = ((rowData['fee_msat'] || 0))?.toString() || '';
          break;

        case 'in_msatoshi':
          rowToFilter = (+(rowData['in_msat'] || 0) / 1000)?.toString() || '';
          break;

        case 'out_msatoshi':
          rowToFilter = (+(rowData['out_msat'] || 0) / 1000)?.toString() || '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  loadFailedEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.failedForwardingEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.failedForwardingEvents.sort = this.sort;
    this.failedForwardingEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'in_msatoshi':
          return data['in_msat'];

        case 'out_msatoshi':
          return data['out_msat'];

        case 'fee':
          return data['fee_msat'];

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.failedForwardingEvents.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.failedForwardingEvents);
  }

  onDownloadCSV() {
    if (this.failedForwardingEvents && this.failedForwardingEvents.data && this.failedForwardingEvents.data.length > 0) {
      this.commonService.downloadFile(this.failedForwardingEvents.data, 'Failed-transactions');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

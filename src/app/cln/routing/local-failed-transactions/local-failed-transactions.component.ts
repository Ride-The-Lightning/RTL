import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ListForwards, LocalFailedEvent } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, CLNFailReason, CLNForwardingEventsStatusEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLN_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getForwardingHistory } from '../../store/cln.actions';
import { clnPageSettings, localFailedForwardingHistory } from '../../store/cln.selector';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'rtl-cln-local-failed-history',
  templateUrl: './local-failed-transactions.component.html',
  styleUrls: ['./local-failed-transactions.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Local failed events') }
  ]
})
export class CLNLocalFailedTransactionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public faExclamationTriangle = faExclamationTriangle;
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'routing';
  public tableSetting: TableSetting = { tableId: 'local_failed', recordsPerPage: PAGE_SIZE, sortBy: 'received_time', sortOrder: SortOrderEnum.DESCENDING };
  public CLNFailReason = CLNFailReason;
  public failedLocalEvents: any[] = [];
  public errorMessage = '';
  public displayedColumns: any[] = [];
  public failedLocalForwardingEvents: any = new MatTableDataSource([]);
  public selFilter = '';
  public totalLocalFailedTransactions = 0;
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
    this.store.dispatch(getForwardingHistory({ payload: { status: CLNForwardingEventsStatusEnum.LOCAL_FAILED } }));
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
    this.store.select(localFailedForwardingHistory).pipe(takeUntil(this.unSubs[1])).
      subscribe((lffhSeletor: { localFailedForwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = lffhSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.totalLocalFailedTransactions = lffhSeletor.localFailedForwardingHistory.totalForwards || 0;
        this.failedLocalEvents = lffhSeletor.localFailedForwardingHistory.listForwards || [];
        if (this.failedLocalEvents&& this.sort && this.paginator && this.displayedColumns.length > 0) {
          this.loadLocalfailedLocalEventsTable(this.failedLocalEvents);
        }
        this.logger.info(lffhSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.failedLocalEvents.length > 0) {
      this.loadLocalfailedLocalEventsTable(this.failedLocalEvents);
    }
  }

  onFailedLocalEventClick(selFEvent: LocalFailedEvent) {
    const reorderedFHEvent = [
      [{ key: 'received_time', value: selFEvent.received_time, title: 'Received Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'in_channel_alias', value: selFEvent.in_channel_alias, title: 'Inbound Channel', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'in_msatoshi', value: selFEvent.in_msat, title: 'Amount In (mSats)', width: 100, type: DataTypeEnum.NUMBER }],
      [{ key: 'failreason', value: selFEvent.failreason ? this.CLNFailReason[selFEvent.failreason] : '', title: 'Reason for Failure', width: 100, type: DataTypeEnum.STRING }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Local Failed Event Information',
          message: reorderedFHEvent
        }
      }
    }));
  }

  applyFilter() {
    this.failedLocalForwardingEvents.filter = this.selFilter.trim().toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.failedLocalForwardingEvents.filterPredicate = (rowData: LocalFailedEvent, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = (rowData.received_time ? this.datePipe.transform(new Date(rowData.received_time * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() : '') +
          (rowData.in_channel_alias ? rowData.in_channel_alias.toLowerCase() : '') +
          ((rowData.failreason && this.CLNFailReason[rowData.failreason]) ? this.CLNFailReason[rowData.failreason].toLowerCase() : '') +
          (rowData.in_msat ? rowData.in_msat : '');
          break;

        case 'received_time':
          rowToFilter = this.datePipe.transform(new Date((rowData.received_time || 0) * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        case 'in_msatoshi':
          rowToFilter = ((+(rowData['in_msat'] || 0)) / 1000)?.toString() || '';
          break;

        case 'failreason':
          rowToFilter = rowData?.failreason ? this.CLNFailReason[rowData?.failreason] : '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return this.selFilterBy === 'failreason' ? rowToFilter.indexOf(fltr) === 0 : rowToFilter.includes(fltr);
    };
  }

  loadLocalfailedLocalEventsTable(forwardingEvents: LocalFailedEvent[]) {
    this.failedLocalForwardingEvents = new MatTableDataSource<LocalFailedEvent>([...forwardingEvents]);
    this.failedLocalForwardingEvents.sort = this.sort;
    this.failedLocalForwardingEvents.sortingDataAccessor = (data: LocalFailedEvent, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'in_msatoshi':
          return data['in_msat'];

        case 'failreason':
          return data.failreason ? this.CLNFailReason[data.failreason] : '';

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.failedLocalForwardingEvents.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.failedLocalForwardingEvents);
  }

  onDownloadCSV() {
    if (this.failedLocalForwardingEvents && this.failedLocalForwardingEvents.data && this.failedLocalForwardingEvents.data.length > 0) {
      this.commonService.downloadFile(this.failedLocalForwardingEvents.data, 'Local-failed-transactions');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

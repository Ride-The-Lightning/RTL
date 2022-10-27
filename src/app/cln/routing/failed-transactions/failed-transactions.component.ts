import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ForwardingEvent, ListForwards } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, CLNForwardingEventsStatusEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getForwardingHistory } from '../../store/cln.actions';
import { clnPageSettings, failedForwardingHistory } from '../../store/cln.selector';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PageSettings, TableSetting } from '../../../shared/models/pageSettings';

@Component({
  selector: 'rtl-cln-failed-history',
  templateUrl: './failed-transactions.component.html',
  styleUrls: ['./failed-transactions.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Failed events') }
  ]
})
export class CLNFailedTransactionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
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

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
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
        if (this.failedEvents.length > 0 && this.sort && this.paginator) {
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
    const reorderedFHEvent = [
      [{ key: 'received_time', value: selFEvent.received_time, title: 'Received Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'resolved_time', value: selFEvent.resolved_time, title: 'Resolved Time', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'in_channel_alias', value: selFEvent.in_channel_alias, title: 'Inbound Channel', width: 50, type: DataTypeEnum.STRING },
      { key: 'out_channel_alias', value: selFEvent.out_channel_alias, title: 'Outbound Channel', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'in_msatoshi', value: selFEvent.in_msatoshi, title: 'Amount In (mSats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'out_msatoshi', value: selFEvent.out_msatoshi, title: 'Amount Out (mSats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'fee', value: selFEvent.fee, title: 'Fee (mSats)', width: 34, type: DataTypeEnum.NUMBER }]
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

  loadFailedEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.failedForwardingEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.failedForwardingEvents.sort = this.sort;
    this.failedForwardingEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.failedForwardingEvents.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.failedForwardingEvents.filterPredicate = (event: ForwardingEvent, fltr: string) => {
      const newEvent =
        (event.received_time ? this.datePipe.transform(new Date(event.received_time * 1000), 'dd/MMM/YYYY HH:mm')!.toLowerCase() : '') +
        (event.resolved_time ? this.datePipe.transform(new Date(event.resolved_time * 1000), 'dd/MMM/YYYY HH:mm')?.toLowerCase() : '') +
        (event.payment_hash ? event.payment_hash.toLowerCase() : '') +
        (event.in_channel ? event.in_channel.toLowerCase() : '') + (event.out_channel ? event.out_channel.toLowerCase() : '') +
        (event.in_channel_alias ? event.in_channel_alias.toLowerCase() : '') + (event.out_channel_alias ? event.out_channel_alias.toLowerCase() : '') +
        (event.in_msatoshi ? (event.in_msatoshi / 1000) : '') + (event.out_msatoshi ? (event.out_msatoshi / 1000) : '') + (event.fee ? event.fee : '');
      return newEvent?.includes(fltr) || false;
    };
    this.failedForwardingEvents.paginator = this.paginator;
    this.applyFilter();
    this.logger.info(this.failedForwardingEvents);
  }

  onDownloadCSV() {
    if (this.failedForwardingEvents && this.failedForwardingEvents.data && this.failedForwardingEvents.data.length > 0) {
      this.commonService.downloadFile(this.failedForwardingEvents.data, 'Failed-transactions');
    }
  }

  applyFilter() {
    this.failedForwardingEvents.filter = this.selFilter.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

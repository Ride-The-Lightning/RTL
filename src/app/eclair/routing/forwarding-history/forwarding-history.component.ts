import { Component, OnInit, OnChanges, AfterViewInit, ViewChild, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { PaymentRelayed, Payments } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, ECL_DEFAULT_PAGE_SETTINGS, ECL_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { eclPageSettings, payments } from '../../store/ecl.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-ecl-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class ECLForwardingHistoryComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @Input() pageId = 'routing';
  @Input() tableId = 'forwarding_history';
  @Input() eventsData: PaymentRelayed[] = [];
  @Input() selFilter = '';
  public nodePageDefs = ECL_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public tableSetting: TableSetting = { tableId: 'forwarding_history', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING };
  public displayedColumns: any[] = [];
  public forwardingHistoryEvents: any = new MatTableDataSource([]);
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.select(eclPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting.tableId = this.tableId;
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.pageId)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || ECL_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.pageId)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.displayedColumns.unshift('type');
        this.displayedColumns.push('actions');
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(payments).pipe(takeUntil(this.unSubs[1])).
      subscribe((paymentsSelector: { payments: Payments, apiCallStatus: ApiCallStatusPayload }) => {
        if (this.eventsData.length === 0) {
          this.errorMessage = '';
          this.apiCallStatus = paymentsSelector.apiCallStatus;
          if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
            this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
          }
          this.eventsData = paymentsSelector.payments && paymentsSelector.payments.relayed ? paymentsSelector.payments.relayed : [];
          if (this.eventsData.length > 0 && this.sort && this.paginator && this.displayedColumns.length > 0) {
            this.loadForwardingEventsTable(this.eventsData);
          }
          this.logger.info(this.eventsData);
        }
      });
  }

  ngAfterViewInit() {
    if (this.eventsData.length > 0) {
      this.loadForwardingEventsTable(this.eventsData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventsData) {
      this.apiCallStatus = { status: APICallStatusEnum.COMPLETED, action: 'FetchPayments' };
      this.eventsData = changes.eventsData.currentValue;
      if (!changes.eventsData.firstChange) {
        this.loadForwardingEventsTable(this.eventsData);
      }
    }
    if (changes.selFilter && !changes.selFilter.firstChange) {
      this.applyFilter();
    }
  }

  onForwardingEventClick(selFEvent: PaymentRelayed, event: any) {
    const reorderedFHEvent = [
      [{ key: 'paymentHash', value: selFEvent.paymentHash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'timestamp', value: Math.round((selFEvent.timestamp || 0) / 1000), title: 'Date/Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'fee', value: ((selFEvent.amountIn || 0) - (selFEvent.amountOut || 0)), title: 'Fee Earned (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'amountIn', value: selFEvent.amountIn, title: 'Amount In (Sats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'amountOut', value: selFEvent.amountOut, title: 'Amount Out (Sats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'fromChannelAlias', value: selFEvent.fromChannelAlias, title: 'From Channel Alias', width: 50, type: DataTypeEnum.STRING },
      { key: 'fromShortChannelId', value: selFEvent.fromShortChannelId, title: 'From Short Channel ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'fromChannelId', value: selFEvent.fromChannelId, title: 'From Channel ID', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'toChannelAlias', value: selFEvent.toChannelAlias, title: 'To Channel Alias', width: 50, type: DataTypeEnum.STRING },
      { key: 'toShortChannelId', value: selFEvent.toShortChannelId, title: 'To Short Channel ID', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'toChannelId', value: selFEvent.toChannelId, title: 'To Channel ID', width: 100, type: DataTypeEnum.STRING }]
    ];
    if (selFEvent.type !== 'payment-relayed') {
      reorderedFHEvent?.unshift([{ key: 'type', value: this.commonService.camelCase(selFEvent.type), title: 'Relay Type', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Event Information',
          message: reorderedFHEvent
        }
      }
    }));
  }

  applyFilter() {
    if (this.forwardingHistoryEvents) {
      this.forwardingHistoryEvents.filter = this.selFilter.trim().toLowerCase();
    }
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.pageId][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : 'all';
  }

  setFilterPredicate() {
    this.forwardingHistoryEvents.filterPredicate = (rowData: PaymentRelayed, fltr: string) => {
      const newRowData = ((rowData.timestamp) ? this.datePipe.transform(new Date(rowData.timestamp), 'dd/MMM/YYYY HH:mm')?.toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
      return newRowData.includes(fltr);
    };
    // this.forwardingHistoryEvents.filterPredicate = (rowData: PaymentRelayed, fltr: string) => {
    //   let rowToFilter = '';
    //   switch (this.selFilterBy) {
    //     case 'all':
    //       for (let i = 0; i < this.displayedColumns.length - 1; i++) {
    //         rowToFilter = rowToFilter + (
    //           (this.displayedColumns[i] === '') ?
    //             (rowData ? rowData..toLowerCase() : '') :
    //             (rowData[this.displayedColumns[i]] ? rowData[this.displayedColumns[i]].toLowerCase() : '')
    //         ) + ', ';
    //       }
    //       break;

    //     case '':
    //       rowToFilter = (rowData ? rowData..toLowerCase() : '');
    //       break;

    //     default:
    //       rowToFilter = (rowData[this.selFilterBy] ? rowData[this.selFilterBy].toLowerCase() : '');
    //       break;
    //   }
    //   return rowToFilter.includes(fltr);
    // };
  }

  loadForwardingEventsTable(forwardingEvents: PaymentRelayed[]) {
    this.forwardingHistoryEvents = new MatTableDataSource<PaymentRelayed>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'fee':
          return data.amountIn - data.amountOut;

        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    };
    this.forwardingHistoryEvents.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
    this.forwardingHistoryEvents.paginator = this.paginator;
    this.setFilterPredicate();
    this.applyFilter();
    this.logger.info(this.forwardingHistoryEvents);
  }

  onDownloadCSV() {
    if (this.forwardingHistoryEvents && this.forwardingHistoryEvents.data && this.forwardingHistoryEvents.data.length > 0) {
      this.commonService.downloadFile(this.forwardingHistoryEvents.data, 'Forwarding-history');
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

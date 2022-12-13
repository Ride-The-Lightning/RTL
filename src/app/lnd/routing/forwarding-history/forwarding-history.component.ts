import { Component, OnInit, OnChanges, ViewChild, Input, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ForwardingEvent, SwitchRes } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { openAlert } from '../../../store/rtl.actions';

import { RTLState } from '../../../store/rtl.state';
import { forwardingHistory, lndPageSettings } from '../../store/lnd.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

@Component({
  selector: 'rtl-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss'],
  providers: [
    { provide: MAT_SELECT_CONFIG, useValue: { overlayPanelClass: 'rtl-select-overlay' } },
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class ForwardingHistoryComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @Input() pageId = 'routing';
  @Input() tableId = 'forwarding_history';
  @Input() eventsData = [];
  @Input() selFilter = '';
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterBy = 'all';
  public colWidth = '20rem';
  public tableSetting: TableSetting = { tableId: 'forwarding_history', recordsPerPage: PAGE_SIZE, sortBy: 'timestamp', sortOrder: SortOrderEnum.DESCENDING };
  public forwardingHistoryData: ForwardingEvent[] = [];
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
    this.store.select(lndPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting.tableId = this.tableId;
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.pageId)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || LND_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.pageId)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
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
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[1])).
      subscribe((fhSelector: { forwardingHistory: SwitchRes, apiCallStatus: ApiCallStatusPayload }) => {
        if (this.eventsData.length <= 0) {
          this.errorMessage = '';
          this.apiCallStatus = fhSelector.apiCallStatus;
          if (fhSelector.apiCallStatus?.status === APICallStatusEnum.ERROR) {
            this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
          }
          this.forwardingHistoryData = fhSelector.forwardingHistory.forwarding_events || [];
          this.loadForwardingEventsTable(this.forwardingHistoryData);
          this.logger.info(fhSelector.apiCallStatus);
          this.logger.info(fhSelector.forwardingHistory);
        }
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.forwardingHistoryData.length > 0) {
        this.loadForwardingEventsTable(this.forwardingHistoryData);
      }
    }, 0);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventsData) {
      this.apiCallStatus = { status: APICallStatusEnum.COMPLETED, action: 'FetchForwardingHistory' };
      this.eventsData = changes.eventsData.currentValue;
      this.forwardingHistoryData = this.eventsData;
      if (!changes.eventsData.firstChange) {
        this.loadForwardingEventsTable(this.forwardingHistoryData);
      }
    }
    if (changes.selFilter && !changes.selFilter.firstChange) {
      this.selFilterBy = 'all';
      this.applyFilter();
    }
  }

  onForwardingEventClick(selFEvent: ForwardingEvent, event: any) {
    const reorderedFHEvent = [
      [{ key: 'timestamp', value: selFEvent.timestamp, title: 'Timestamp', width: 25, type: DataTypeEnum.DATE_TIME },
      { key: 'amt_in', value: selFEvent.amt_in, title: 'Inbound Amount (Sats)', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'amt_out', value: selFEvent.amt_out, title: 'Outbound Amount (Sats)', width: 25, type: DataTypeEnum.NUMBER },
      { key: 'fee_msat', value: selFEvent.fee_msat, title: 'Fee (mSats)', width: 25, type: DataTypeEnum.NUMBER }],
      [{ key: 'alias_in', value: selFEvent.alias_in, title: 'Inbound Peer Alias', width: 25, type: DataTypeEnum.STRING },
      { key: 'chan_id_in', value: selFEvent.chan_id_in, title: 'Inbound Channel ID', width: 25, type: DataTypeEnum.STRING },
      { key: 'alias_out', value: selFEvent.alias_out, title: 'Outbound Peer Alias', width: 25, type: DataTypeEnum.STRING },
      { key: 'chan_id_out', value: selFEvent.chan_id_out, title: 'Outbound Channel ID', width: 25, type: DataTypeEnum.STRING }]
    ];
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
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.forwardingHistoryEvents.filterPredicate = (rowData: ForwardingEvent, fltr: string) => {
      let rowToFilter = '';
      switch (this.selFilterBy) {
        case 'all':
          rowToFilter = ((rowData.timestamp) ? this.datePipe.transform(new Date(rowData.timestamp * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() : '') + JSON.stringify(rowData).toLowerCase();
          break;

        case 'timestamp':
          rowToFilter = this.datePipe.transform(new Date((rowData[this.selFilterBy] || 0) * 1000), 'dd/MMM/y HH:mm')?.toLowerCase() || '';
          break;

        default:
          rowToFilter = typeof rowData[this.selFilterBy] === 'undefined' ? '' : typeof rowData[this.selFilterBy] === 'string' ? rowData[this.selFilterBy].toLowerCase() : typeof rowData[this.selFilterBy] === 'boolean' ? (rowData[this.selFilterBy] ? 'yes' : 'no') : rowData[this.selFilterBy].toString();
          break;
      }
      return rowToFilter.includes(fltr);
    };
  }

  loadForwardingEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.forwardingHistoryEvents = forwardingEvents ? new MatTableDataSource<ForwardingEvent>([...forwardingEvents]) : new MatTableDataSource([]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.forwardingHistoryEvents.sort?.sort({ active: this.tableSetting.sortBy, direction: this.tableSetting.sortOrder, disableClear: true });
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

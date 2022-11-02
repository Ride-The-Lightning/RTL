import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, CLN_DEFAULT_PAGE_SETTINGS, CLNForwardingEventsStatusEnum, CLN_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ForwardingEvent, ListForwards, RoutingPeer } from '../../../shared/models/clnModels';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { clnPageSettings, forwardingHistory } from '../../store/cln.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { getForwardingHistory } from '../../store/cln.actions';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-cln-routing-peers',
  templateUrl: './routing-peers.component.html',
  styleUrls: ['./routing-peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class CLNRoutingPeersComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @ViewChild('tableIn', { read: MatSort, static: false }) sortIn: MatSort;
  @ViewChild('tableOut', { read: MatSort, static: false }) sortOut: MatSort;
  @ViewChild('paginatorIn', { static: false }) paginatorIn: MatPaginator | undefined;
  @ViewChild('paginatorOut', { static: false }) paginatorOut: MatPaginator | undefined;
  @Input() eventsData = [];
  @Input() selFilter = '';
  public nodePageDefs = CLN_PAGE_DEFS;
  public selFilterByIn = 'all';
  public selFilterByOut = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'routing';
  public tableSetting: TableSetting = { tableId: 'routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'total_fee', sortOrder: SortOrderEnum.DESCENDING };
  public successfulEvents: ForwardingEvent[] = [];
  public displayedColumns: any[] = [];
  public routingPeersIncoming: any = [];
  public routingPeersOutgoing: any = [];
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public filterIn = '';
  public filterOut = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private camelCaseWithReplace: CamelCaseWithReplacePipe) {
    this.screenSize = this.commonService.getScreenSize();
  }

  ngOnInit() {
    this.store.pipe(take(1)).subscribe((state) => {
      if (state.cln.apisCallStatus.FetchForwardingHistoryS.status === APICallStatusEnum.UN_INITIATED && !state.cln.forwardingHistory.listForwards?.length) {
        this.store.dispatch(getForwardingHistory({ payload: { status: CLNForwardingEventsStatusEnum.SETTLED } }));
      }
    });
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
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[1])).
      subscribe((fhSeletor: { forwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }) => {
        if (this.eventsData.length <= 0) {
          this.errorMessage = '';
          this.apiCallStatus = fhSeletor.apiCallStatus;
          if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
            this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
          }
          this.successfulEvents = fhSeletor.forwardingHistory.listForwards || [];
          if (this.successfulEvents.length > 0 && this.sortIn && this.paginatorIn && this.sortOut && this.paginatorOut) {
            this.loadRoutingPeersTable(this.successfulEvents);
          }
          this.logger.info(fhSeletor);
        }
      });
  }

  ngAfterViewInit() {
    if (this.successfulEvents.length > 0) {
      this.loadRoutingPeersTable(this.successfulEvents);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventsData) {
      this.apiCallStatus = { status: APICallStatusEnum.COMPLETED, action: 'FetchForwardingHistory' };
      this.eventsData = changes.eventsData.currentValue;
      this.successfulEvents = this.eventsData;
      if (!changes.eventsData.firstChange) {
        this.loadRoutingPeersTable(this.successfulEvents);
      }
    }
  }

  applyIncomingFilter() {
    this.routingPeersIncoming.filter = this.filterIn.toLowerCase();
  }

  applyOutgoingFilter() {
    this.routingPeersOutgoing.filter = this.filterOut.toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : 'all';
  }

  setFilterPredicate() {
    this.routingPeersIncoming.filterPredicate = (rpIn: RoutingPeer, fltr: string) => JSON.stringify(rpIn).toLowerCase().includes(fltr);
    this.routingPeersOutgoing.filterPredicate = (rpOut: RoutingPeer, fltr: string) => JSON.stringify(rpOut).toLowerCase().includes(fltr);
    // this.routingPeersIncoming.filterPredicate = (rowData: RoutingPeer, fltr: string) => {
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

  loadRoutingPeersTable(events: ForwardingEvent[]) {
    if (events.length > 0) {
      const results = this.groupRoutingPeers(events);
      this.routingPeersIncoming = new MatTableDataSource<RoutingPeer[]>(results[0]);
      this.routingPeersIncoming.sort = this.sortIn;
      this.routingPeersIncoming.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
      this.routingPeersIncoming.paginator = this.paginatorIn;
      this.logger.info(this.routingPeersIncoming);
      this.routingPeersOutgoing = new MatTableDataSource<RoutingPeer[]>(results[1]);
      this.routingPeersOutgoing.sort = this.sortOut;
      this.routingPeersOutgoing.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
      this.routingPeersOutgoing.paginator = this.paginatorOut;
      this.logger.info(this.routingPeersOutgoing);
    } else {
      // To reset table after other Forwarding history calls
      this.routingPeersIncoming = new MatTableDataSource<RoutingPeer>([]);
      this.routingPeersOutgoing = new MatTableDataSource<RoutingPeer>([]);
    }
    this.setFilterPredicate();
    this.applyIncomingFilter();
    this.applyOutgoingFilter();
    this.logger.info(this.routingPeersIncoming);
    this.logger.info(this.routingPeersOutgoing);
  }

  groupRoutingPeers(forwardingEvents: ForwardingEvent[]) {
    const incomingResults: RoutingPeer[] = [];
    const outgoingResults: RoutingPeer[] = [];
    forwardingEvents.forEach((event: ForwardingEvent) => {
      const incoming: any = incomingResults?.find((result) => result.channel_id === event.in_channel);
      const outgoing: any = outgoingResults?.find((result) => result.channel_id === event.out_channel);
      if (!incoming) {
        incomingResults.push({ channel_id: event.in_channel, alias: event.in_channel_alias, events: 1, total_amount: event.in_msatoshi, total_fee: ((event.in_msatoshi || 0) - (event.out_msatoshi || 0)) });
      } else {
        incoming.events++;
        incoming.total_amount = +incoming.total_amount + +(event.in_msatoshi || 0);
        incoming.total_fee = +incoming.total_fee + ((event.in_msatoshi || 0) - (event.out_msatoshi || 0));
      }
      if (!outgoing) {
        outgoingResults.push({ channel_id: event.out_channel, alias: event.out_channel_alias, events: 1, total_amount: event.out_msatoshi, total_fee: ((event.in_msatoshi || 0) - (event.out_msatoshi || 0)) });
      } else {
        outgoing.events++;
        outgoing.total_amount = +outgoing.total_amount + +(event.out_msatoshi || 0);
        outgoing.total_fee = +outgoing.total_fee + ((event.in_msatoshi || 0) - (event.out_msatoshi || 0));
      }
    });
    return [this.commonService.sortDescByKey(incomingResults, 'total_fee'), this.commonService.sortDescByKey(outgoingResults, 'total_fee')];
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

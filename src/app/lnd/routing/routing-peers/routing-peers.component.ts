import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';

import { ForwardingEvent, RoutingPeers, SwitchRes } from '../../../shared/models/lndModels';
import { AlertTypeEnum, APICallStatusEnum, DataTypeEnum, getPaginatorLabel, LND_DEFAULT_PAGE_SETTINGS, LND_PAGE_DEFS, PAGE_SIZE, PAGE_SIZE_OPTIONS, ScreenSizeEnum, SortOrderEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { openAlert } from '../../../store/rtl.actions';
import { RTLState } from '../../../store/rtl.state';
import { forwardingHistory, lndPageSettings } from '../../store/lnd.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-routing-peers',
  templateUrl: './routing-peers.component.html',
  styleUrls: ['./routing-peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Routing peers') }
  ]
})
export class RoutingPeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('tableIn', { read: MatSort, static: false }) sortIn: MatSort;
  @ViewChild('tableOut', { read: MatSort, static: false }) sortOut: MatSort;
  @ViewChild('paginatorIn', { static: false }) paginatorIn: MatPaginator | undefined;
  @ViewChild('paginatorOut', { static: false }) paginatorOut: MatPaginator | undefined;
  public nodePageDefs = LND_PAGE_DEFS;
  public selFilterByIn = 'all';
  public selFilterByOut = 'all';
  public colWidth = '20rem';
  public PAGE_ID = 'routing';
  public tableSetting: TableSetting = { tableId: 'routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'total_amount', sortOrder: SortOrderEnum.DESCENDING };
  public routingPeersData: any[] = [];
  public displayedColumns: any[] = [];
  public routingPeersIncoming = new MatTableDataSource<RoutingPeers>([]);
  public routingPeersOutgoing = new MatTableDataSource<RoutingPeers>([]);
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
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[1])).
      subscribe((fhSelector: { forwardingHistory: SwitchRes, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = fhSelector.apiCallStatus;
        if (fhSelector.apiCallStatus?.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (fhSelector.forwardingHistory.forwarding_events) {
          this.routingPeersData = fhSelector.forwardingHistory.forwarding_events;
        } else {
          this.routingPeersData = [];
        }
        if (this.routingPeersData.length > 0 && this.sortIn && this.paginatorIn && this.sortOut && this.paginatorOut) {
          this.loadRoutingPeersTable(this.routingPeersData);
        }
        this.logger.info(fhSelector.apiCallStatus);
        this.logger.info(fhSelector.forwardingHistory);
      });
  }

  ngAfterViewInit() {
    if (this.routingPeersData.length > 0) {
      this.loadRoutingPeersTable(this.routingPeersData);
    }
  }

  onRoutingPeerClick(selRPeer: RoutingPeers, event: any, direction: string) {
    let alertTitle = ' Routing Information';
    if (direction === 'in') {
      alertTitle = 'Incoming' + alertTitle;
    } else {
      alertTitle = 'Outgoing' + alertTitle;
    }
    const reorderedRoutingPeer = [
      [{ key: 'chan_id', value: selRPeer.chan_id, title: 'Channel ID', width: 50, type: DataTypeEnum.STRING },
      { key: 'alias', value: selRPeer.alias, title: 'Peer Alias', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'events', value: selRPeer.events, title: 'Events', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'total_amount', value: selRPeer.total_amount, title: 'Total Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER }]
    ];
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: alertTitle,
          message: reorderedRoutingPeer
        }
      }
    }));
  }

  applyFilterIncoming() {
    this.routingPeersIncoming.filter = this.filterIn.toLowerCase();
  }

  applyFilterOutgoing() {
    this.routingPeersOutgoing.filter = this.filterOut.toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : this.commonService.titleCase(column);
  }

  setFilterPredicate() {
    this.routingPeersIncoming.filterPredicate = (rowDataIn: RoutingPeers, fltr: string) => {
      let rowToFilterIn = '';
      switch (this.selFilterByIn) {
        case 'all':
          rowToFilterIn = JSON.stringify(rowDataIn).toLowerCase();
          break;

        default:
          rowToFilterIn = typeof rowDataIn[this.selFilterByIn] === 'string' ? rowDataIn[this.selFilterByIn].toLowerCase() : typeof rowDataIn[this.selFilterByIn] === 'boolean' ? (rowDataIn[this.selFilterByIn] ? 'yes' : 'no') : rowDataIn[this.selFilterByIn].toString();
          break;
      }
      return rowToFilterIn.includes(fltr);
    };

    this.routingPeersOutgoing.filterPredicate = (rowDataOut: RoutingPeers, fltr: string) => {
      let rowToFilterOut = '';
      switch (this.selFilterByOut) {
        case 'all':
          rowToFilterOut = JSON.stringify(rowDataOut).toLowerCase();
          break;

        case 'total_amount':
        case 'total_fee':
          rowToFilterOut = ((+(rowDataOut[this.selFilterByOut] || 0)) / 1000)?.toString() || '';
          break;

        default:
          rowToFilterOut = typeof rowDataOut[this.selFilterByOut] === 'string' ? rowDataOut[this.selFilterByOut].toLowerCase() : typeof rowDataOut[this.selFilterByOut] === 'boolean' ? (rowDataOut[this.selFilterByOut] ? 'yes' : 'no') : rowDataOut[this.selFilterByOut].toString();
          break;
      }
      return rowToFilterOut.includes(fltr);
    };
  }

  loadRoutingPeersTable(forwardingEvents: ForwardingEvent[]) {
    if (forwardingEvents.length > 0) {
      const results = this.groupRoutingPeers(forwardingEvents);
      this.routingPeersIncoming = new MatTableDataSource<RoutingPeers>(results[0]);
      this.routingPeersIncoming.sort = this.sortIn;
      this.routingPeersIncoming.sort.sort({ id: this.tableSetting.sortBy || 'total_amount', start: this.tableSetting.sortOrder || SortOrderEnum.DESCENDING, disableClear: true });
      this.routingPeersIncoming.paginator = this.paginatorIn!;
      this.logger.info(this.routingPeersIncoming);
      this.routingPeersOutgoing = new MatTableDataSource<RoutingPeers>(results[1]);
      this.routingPeersOutgoing.sort = this.sortOut;
      this.routingPeersOutgoing.sort.sort({ id: this.tableSetting.sortBy || 'total_amount', start: this.tableSetting.sortOrder || SortOrderEnum.DESCENDING, disableClear: true });
      this.routingPeersOutgoing.paginator = this.paginatorOut!;
      this.logger.info(this.routingPeersOutgoing);
    } else {
      // To reset table after other Forwarding history calls
      this.routingPeersIncoming = new MatTableDataSource<RoutingPeers>([]);
      this.routingPeersOutgoing = new MatTableDataSource<RoutingPeers>([]);
    }
    this.setFilterPredicate();
    this.applyFilterIncoming();
    this.applyFilterOutgoing();
  }

  groupRoutingPeers(forwardingEvents: ForwardingEvent[]) {
    const incomingResults: any = [];
    const outgoingResults: any = [];
    forwardingEvents.forEach((event) => {
      const incoming: any = incomingResults.find((result) => result.chan_id === event.chan_id_in);
      const outgoing: any = outgoingResults.find((result) => result.chan_id === event.chan_id_out);
      if (!incoming) {
        incomingResults.push({ chan_id: event.chan_id_in, alias: event.alias_in, events: 1, total_amount: +(event.amt_in || 0) });
      } else {
        incoming.events++;
        incoming.total_amount = +incoming.total_amount + +(event.amt_in || 0);
      }
      if (!outgoing) {
        outgoingResults.push({ chan_id: event.chan_id_out, alias: event.alias_out, events: 1, total_amount: +(event.amt_out || 0) });
      } else {
        outgoing.events++;
        outgoing.total_amount = +outgoing.total_amount + +(event.amt_out || 0);
      }
    });
    return [this.commonService.sortDescByKey(incomingResults, 'total_amount'), this.commonService.sortDescByKey(outgoingResults, 'total_amount')];
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

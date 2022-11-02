import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PaymentRelayed, Payments, RoutingPeers } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum, SortOrderEnum, ECL_DEFAULT_PAGE_SETTINGS, ECL_PAGE_DEFS } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { eclPageSettings, payments } from '../../store/ecl.selector';
import { ColumnDefinition, PageSettings, TableSetting } from '../../../shared/models/pageSettings';
import { CamelCaseWithReplacePipe } from '../../../shared/pipes/app.pipe';

@Component({
  selector: 'rtl-ecl-routing-peers',
  templateUrl: './routing-peers.component.html',
  styleUrls: ['./routing-peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]
})
export class ECLRoutingPeersComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('tableIn', { read: MatSort, static: false }) sortIn: MatSort;
  @ViewChild('tableOut', { read: MatSort, static: false }) sortOut: MatSort;
  @ViewChild('paginatorIn', { static: false }) paginatorIn: MatPaginator | undefined;
  @ViewChild('paginatorOut', { static: false }) paginatorOut: MatPaginator | undefined;
  public nodePageDefs = ECL_PAGE_DEFS;
  public selFilterByIn = 'All';
  public selFilterByOut = 'All';
  public colWidth = '20rem';
  public PAGE_ID = 'routing';
  public tableSetting: TableSetting = { tableId: 'routing_peers', recordsPerPage: PAGE_SIZE, sortBy: 'totalFee', sortOrder: SortOrderEnum.DESCENDING };
  public routingPeersData: PaymentRelayed[] = [];
  public displayedColumns: any[] = [];
  public routingPeersIncoming: any = new MatTableDataSource([]);
  public routingPeersOutgoing: any = new MatTableDataSource([]);
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
    this.store.select(eclPageSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((settings: { pageSettings: PageSettings[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = settings.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = this.apiCallStatus.message || '';
        }
        this.tableSetting = settings.pageSettings.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId) || ECL_DEFAULT_PAGE_SETTINGS.find((page) => page.pageId === this.PAGE_ID)?.tables.find((table) => table.tableId === this.tableSetting.tableId)!;
        if (this.screenSize === ScreenSizeEnum.XS || this.screenSize === ScreenSizeEnum.SM) {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelectionSM));
        } else {
          this.displayedColumns = JSON.parse(JSON.stringify(this.tableSetting.columnSelection));
        }
        this.pageSize = this.tableSetting.recordsPerPage ? +this.tableSetting.recordsPerPage : PAGE_SIZE;
        this.colWidth = this.displayedColumns.length ? ((this.commonService.getContainerSize().width / this.displayedColumns.length) / 10) + 'rem' : '20rem';
        this.logger.info(this.displayedColumns);
      });
    this.store.select(payments).pipe(takeUntil(this.unSubs[1])).
      subscribe((paymentsSelector: { payments: Payments, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = paymentsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.routingPeersData = paymentsSelector.payments && paymentsSelector.payments.relayed ? paymentsSelector.payments.relayed : [];
        if (this.routingPeersData.length > 0 && this.sortIn && this.paginatorIn && this.sortOut && this.paginatorOut) {
          this.loadRoutingPeersTable(this.routingPeersData);
        }
        this.logger.info(paymentsSelector);
      });
  }

  ngAfterViewInit() {
    if (this.routingPeersData.length > 0 && this.sortIn && this.paginatorIn && this.sortOut && this.paginatorOut) {
      this.loadRoutingPeersTable(this.routingPeersData);
    }
  }

  applyFilterIncoming() {
    this.routingPeersIncoming.filter = this.filterIn.toLowerCase();
  }

  applyFilterOutgoing() {
    this.routingPeersOutgoing.filter = this.filterOut.toLowerCase();
  }

  getLabel(column: string) {
    const returnColumn: ColumnDefinition = this.nodePageDefs[this.PAGE_ID][this.tableSetting.tableId].allowedColumns.find((col) => col.column === column);
    return returnColumn ? returnColumn.label ? returnColumn.label : this.camelCaseWithReplace.transform(returnColumn.column, '_') : 'All';
  }

  setFilterPredicate() {
    this.routingPeersIncoming.filterPredicate = (rpIn: RoutingPeers, fltr: string) => JSON.stringify(rpIn).toLowerCase().includes(fltr);
    this.routingPeersOutgoing.filterPredicate = (rpOut: RoutingPeers, fltr: string) => JSON.stringify(rpOut).toLowerCase().includes(fltr);
    // this.routingPeersIncoming.filterPredicate = (rowData: RoutingPeer, fltr: string) => {
    //   let rowToFilter = '';
    //   switch (this.selFilterBy) {
    //     case 'All':
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

  loadRoutingPeersTable(forwardingEvents: PaymentRelayed[]) {
    if (forwardingEvents.length > 0) {
      const results = this.groupRoutingPeers(forwardingEvents);
      this.routingPeersIncoming = new MatTableDataSource<RoutingPeers>(results[0]);
      this.routingPeersIncoming.sort = this.sortIn;
      this.routingPeersIncoming.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
      this.routingPeersIncoming.paginator = this.paginatorIn;
      this.logger.info(this.routingPeersIncoming);
      this.routingPeersOutgoing = new MatTableDataSource<RoutingPeers>(results[1]);
      this.routingPeersOutgoing.sort = this.sortOut;
      this.routingPeersOutgoing.sort?.sort({ id: this.tableSetting.sortBy, start: this.tableSetting.sortOrder, disableClear: true });
      this.routingPeersOutgoing.paginator = this.paginatorOut;
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

  groupRoutingPeers(forwardingEvents: PaymentRelayed[]) {
    const incomingResults: RoutingPeers[] = [];
    const outgoingResults: RoutingPeers[] = [];
    forwardingEvents.forEach((event: PaymentRelayed) => {
      const incoming: any = incomingResults.find((result) => result.channelId === event.fromChannelId);
      const outgoing: any = outgoingResults.find((result) => result.channelId === event.toChannelId);
      if (!incoming) {
        incomingResults.push({ channelId: event.fromChannelId, alias: event.fromChannelAlias, events: 1, totalAmount: +event.amountIn, totalFee: (event.amountIn - event.amountOut) });
      } else {
        incoming.events++;
        incoming.totalAmount = +incoming.totalAmount + +event.amountIn;
        incoming.totalFee = +incoming.totalFee + (event.amountIn - event.amountOut);
      }
      if (!outgoing) {
        outgoingResults.push({ channelId: event.toChannelId, alias: event.toChannelAlias, events: 1, totalAmount: +event.amountOut, totalFee: (event.amountIn - event.amountOut) });
      } else {
        outgoing.events++;
        outgoing.totalAmount = +outgoing.totalAmount + +event.amountOut;
        outgoing.totalFee = +outgoing.totalFee + (event.amountIn - event.amountOut);
      }
    });
    return [this.commonService.sortDescByKey(incomingResults, 'totalFee'), this.commonService.sortDescByKey(outgoingResults, 'totalFee')];
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

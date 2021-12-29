import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PaymentRelayed, Payments, RoutingPeers } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { payments } from '../../store/ecl.selector';

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
  public routingPeersData = [];
  public displayedColumns: any[] = [];
  public RoutingPeersIncoming: any;
  public RoutingPeersOutgoing: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public filterIn = '';
  public filterOut = '';
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'totalFee'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'totalFee'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'totalAmount', 'totalFee'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['channelId', 'alias', 'events', 'totalAmount', 'totalFee'];
    }
  }

  ngOnInit() {
    this.store.select(payments).
      pipe(takeUntil(this.unSubs[0])).
      subscribe((paymentsSelector: { payments: Payments, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = paymentsSelector.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
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

  loadRoutingPeersTable(forwardingEvents: PaymentRelayed[]) {
    if (forwardingEvents.length > 0) {
      const results = this.groupRoutingPeers(forwardingEvents);
      this.RoutingPeersIncoming = new MatTableDataSource<RoutingPeers>(results[0]);
      this.RoutingPeersIncoming.sort = this.sortIn;
      this.RoutingPeersIncoming.filterPredicate = (rpIn: RoutingPeers, fltr: string) => JSON.stringify(rpIn).toLowerCase().includes(fltr);
      this.RoutingPeersIncoming.paginator = this.paginatorIn;
      this.logger.info(this.RoutingPeersIncoming);
      this.RoutingPeersOutgoing = new MatTableDataSource<RoutingPeers>(results[1]);
      this.RoutingPeersOutgoing.sort = this.sortOut;
      this.RoutingPeersOutgoing.filterPredicate = (rpOut: RoutingPeers, fltr: string) => JSON.stringify(rpOut).toLowerCase().includes(fltr);
      this.RoutingPeersOutgoing.paginator = this.paginatorOut;
      this.logger.info(this.RoutingPeersOutgoing);
    } else {
      // To reset table after other Forwarding history calls
      this.RoutingPeersIncoming = new MatTableDataSource<RoutingPeers>([]);
      this.RoutingPeersOutgoing = new MatTableDataSource<RoutingPeers>([]);
    }
    this.applyIncomingFilter();
    this.applyOutgoingFilter();
  }

  groupRoutingPeers(forwardingEvents: PaymentRelayed[]) {
    const incomingResults: RoutingPeers[] = [];
    const outgoingResults: RoutingPeers[] = [];
    forwardingEvents.forEach((event) => {
      const incoming = incomingResults.find((result) => result.channelId === event.fromChannelId);
      const outgoing = outgoingResults.find((result) => result.channelId === event.toChannelId);
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

  applyIncomingFilter() {
    this.RoutingPeersIncoming.filter = this.filterIn.toLowerCase();
  }

  applyOutgoingFilter() {
    this.RoutingPeersOutgoing.filter = this.filterOut.toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

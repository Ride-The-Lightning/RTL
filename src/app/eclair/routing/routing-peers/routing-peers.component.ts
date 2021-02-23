import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PaymentRelayed, RoutingPeers } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-routing-peers',
  templateUrl: './routing-peers.component.html',
  styleUrls: ['./routing-peers.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Peers') }
  ]  
})
export class ECLRoutingPeersComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sortIn: MatSort;
  @ViewChild('tableOut', {read: MatSort, static: false}) sortOut: MatSort;
  @ViewChild('paginatorIn', {static: false}) paginatorIn: MatPaginator|undefined;
  @ViewChild('paginatorOut', {static: false}) paginatorOut: MatPaginator|undefined;
  public routingPeersData = [];
  public errorMessage = '';
  public displayedColumns: any[] = [];
  public RoutingPeersIncoming: any;
  public RoutingPeersOutgoing: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'totalFee'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'totalFee'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'totalAmount', 'totalFee'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['channelId', 'alias', 'events', 'totalAmount', 'totalFee'];
    }
  }

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPayments') {
          this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
        }
      });
      this.routingPeersData = rtlStore.payments && rtlStore.payments.relayed ? rtlStore.payments.relayed : [];
      if (this.routingPeersData.length > 0 && this.sortIn && this.paginatorIn && this.sortOut && this.paginatorOut) {
        this.loadRoutingPeersTable(this.routingPeersData);
      }
      this.logger.info(rtlStore);
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
  }

  groupRoutingPeers(forwardingEvents: PaymentRelayed[]) {
    const incomingResults: RoutingPeers[] = [];
    const outgoingResults: RoutingPeers[] = [];
    forwardingEvents.forEach(event => {
      const incoming = incomingResults.find(result => result.channelId === event.fromChannelId);
      const outgoing = outgoingResults.find(result => result.channelId === event.toChannelId);
      if (!incoming) {
        incomingResults.push({channelId: event.fromChannelId, alias: event.fromChannelAlias, events: 1, totalAmount: +event.amountIn, totalFee: (event.amountIn - event.amountOut)});
      } else {
        incoming.events++;
        incoming.totalAmount = +incoming.totalAmount + +event.amountIn;
        incoming.totalFee = +incoming.totalFee + (event.amountIn - event.amountOut);
      }
      if (!outgoing) {
        outgoingResults.push({channelId: event.toChannelId, alias: event.toChannelAlias, events: 1, totalAmount: +event.amountOut, totalFee: (event.amountIn - event.amountOut)});
      } else {
        outgoing.events++;
        outgoing.totalAmount = +outgoing.totalAmount + +event.amountOut;
        outgoing.totalFee = +outgoing.totalFee + (event.amountIn - event.amountOut);
      }
    });
    return [this.commonService.sortDescByKey(incomingResults, 'totalFee'), this.commonService.sortDescByKey(outgoingResults, 'totalFee')];
  }

  applyIncomingFilter(selFilter: any) {
    this.RoutingPeersIncoming.filter = selFilter.value.trim().toLowerCase();
  }

  applyOutgoingFilter(selFilter: any) {
    this.RoutingPeersOutgoing.filter = selFilter.value.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

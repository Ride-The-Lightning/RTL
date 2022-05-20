import { Component, OnInit, AfterViewInit, ViewChild, OnDestroy, Input, SimpleChanges, OnChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MatSort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, ScreenSizeEnum, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { ForwardingEvent, ListForwards, RoutingPeer } from '../../../shared/models/clnModels';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { forwardingHistory } from '../../store/cln.selector';

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
  @Input() filterValue = '';
  public successfulEvents = [];
  public displayedColumns: any[] = [];
  public RoutingPeersIncoming: any = [];
  public RoutingPeersOutgoing: any = [];
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
      this.displayedColumns = ['alias', 'total_fee'];
    } else if (this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'total_fee'];
    } else if (this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['alias', 'events', 'total_amount', 'total_fee'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['channel_id', 'alias', 'events', 'total_amount', 'total_fee'];
    }
  }

  ngOnInit() {
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[0])).
      subscribe((fhSeletor: { forwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }) => {
        if (this.eventsData.length <= 0) {
          this.errorMessage = '';
          this.apiCallStatus = fhSeletor.apiCallStatus;
          if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
            this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
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

  loadRoutingPeersTable(events: ForwardingEvent[]) {
    if (events.length > 0) {
      const results = this.groupRoutingPeers(events);
      this.RoutingPeersIncoming = new MatTableDataSource<RoutingPeer[]>(results[0]);
      this.RoutingPeersIncoming.sort = this.sortIn;
      this.RoutingPeersIncoming.filterPredicate = (rpIn: RoutingPeer, fltr: string) => JSON.stringify(rpIn).toLowerCase().includes(fltr);
      this.RoutingPeersIncoming.paginator = this.paginatorIn;
      this.logger.info(this.RoutingPeersIncoming);
      this.RoutingPeersOutgoing = new MatTableDataSource<RoutingPeer[]>(results[1]);
      this.RoutingPeersOutgoing.sort = this.sortOut;
      this.RoutingPeersOutgoing.filterPredicate = (rpOut: RoutingPeer, fltr: string) => JSON.stringify(rpOut).toLowerCase().includes(fltr);
      this.RoutingPeersOutgoing.paginator = this.paginatorOut;
      this.logger.info(this.RoutingPeersOutgoing);
    } else {
      // To reset table after other Forwarding history calls
      this.RoutingPeersIncoming = new MatTableDataSource<RoutingPeer>([]);
      this.RoutingPeersOutgoing = new MatTableDataSource<RoutingPeer>([]);
    }
    this.applyIncomingFilter();
    this.applyOutgoingFilter();
    this.logger.info(this.RoutingPeersIncoming);
    this.logger.info(this.RoutingPeersOutgoing);
  }

  groupRoutingPeers(forwardingEvents: ForwardingEvent[]) {
    const incomingResults: RoutingPeer[] = [];
    const outgoingResults: RoutingPeer[] = [];
    forwardingEvents.forEach((event) => {
      const incoming = incomingResults.find((result) => result.channel_id === event.in_channel);
      const outgoing = outgoingResults.find((result) => result.channel_id === event.out_channel);
      if (!incoming) {
        incomingResults.push({ channel_id: event.in_channel, alias: event.in_channel_alias, events: 1, total_amount: event.in_msatoshi, total_fee: (event.in_msatoshi - event.out_msatoshi) });
      } else {
        incoming.events++;
        incoming.total_amount = +incoming.total_amount + +event.in_msatoshi;
        incoming.total_fee = +incoming.total_fee + (event.in_msatoshi - event.out_msatoshi);
      }
      if (!outgoing) {
        outgoingResults.push({ channel_id: event.out_channel, alias: event.out_channel_alias, events: 1, total_amount: event.out_msatoshi, total_fee: (event.in_msatoshi - event.out_msatoshi) });
      } else {
        outgoing.events++;
        outgoing.total_amount = +outgoing.total_amount + +event.out_msatoshi;
        outgoing.total_fee = +outgoing.total_fee + (event.in_msatoshi - event.out_msatoshi);
      }
    });
    return [this.commonService.sortDescByKey(incomingResults, 'total_fee'), this.commonService.sortDescByKey(outgoingResults, 'total_fee')];
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

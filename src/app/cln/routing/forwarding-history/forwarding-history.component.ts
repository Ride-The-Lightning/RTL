import { Component, OnInit, OnChanges, ViewChild, OnDestroy, SimpleChanges, Input, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ForwardingEvent, ListForwards } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, CLNForwardingEventsStatusEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { forwardingHistory } from '../../store/cln.selector';
import { getForwardingHistory } from '../../store/cln.actions';

@Component({
  selector: 'rtl-cln-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class CLNForwardingHistoryComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  @Input() eventsData = [];
  @Input() filterValue = '';
  public successfulEvents: ForwardingEvent[] = [];
  public displayedColumns: any[] = [];
  public forwardingHistoryEvents: any;
  public flgSticky = false;
  public totalForwardedTransactions = 0;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public errorMessage = '';
  public apiCallStatus: ApiCallStatusPayload | null = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['in_msatoshi', 'out_msatoshi', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['received_time', 'in_msatoshi', 'out_msatoshi', 'fee', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['received_time', 'resolved_time', 'in_channel', 'out_channel', 'in_msatoshi', 'out_msatoshi', 'fee', 'actions'];
    }
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.store.pipe(take(1)).subscribe((state) => {
      if (state.cln.apisCallStatus.FetchForwardingHistoryS.status === APICallStatusEnum.UN_INITIATED && !state.cln.forwardingHistory.listForwards?.length) {
        this.store.dispatch(getForwardingHistory({ payload: { status: CLNForwardingEventsStatusEnum.SETTLED } }));
      }
    });
    this.store.select(forwardingHistory).pipe(takeUntil(this.unSubs[0])).
      subscribe((fhSeletor: { forwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = fhSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = !this.apiCallStatus.message ? '' : (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        if (this.eventsData.length <= 0 && fhSeletor.forwardingHistory.listForwards) {
          this.totalForwardedTransactions = fhSeletor.forwardingHistory.totalForwards || 0;
          this.successfulEvents = fhSeletor.forwardingHistory.listForwards || [];
          if (this.successfulEvents.length > 0 && this.sort && this.paginator) {
            this.loadForwardingEventsTable(this.successfulEvents);
          }
          this.logger.info(fhSeletor);
        }
      });
  }

  ngAfterViewInit() {
    if (this.successfulEvents.length > 0) {
      this.loadForwardingEventsTable(this.successfulEvents);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventsData) {
      this.apiCallStatus = { status: APICallStatusEnum.COMPLETED, action: 'FetchForwardingHistory' };
      this.eventsData = changes.eventsData.currentValue;
      this.successfulEvents = this.eventsData;
      this.totalForwardedTransactions = this.eventsData.length;
      if (this.paginator) { this.paginator.firstPage(); }
      if (!changes.eventsData.firstChange) {
        this.loadForwardingEventsTable(this.successfulEvents);
      }
    }
    if (changes.filterValue && !changes.filterValue.firstChange) {
      this.applyFilter();
    }
  }

  onForwardingEventClick(selFEvent: ForwardingEvent, event: any) {
    const reorderedFHEvent = [
      [{ key: 'payment_hash', value: selFEvent.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'status', value: 'Settled', title: 'Status', width: 50, type: DataTypeEnum.STRING },
      { key: 'fee', value: selFEvent.fee, title: 'Fee (mSats)', width: 50, type: DataTypeEnum.NUMBER }],
      [{ key: 'received_time', value: selFEvent.received_time, title: 'Received Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'resolved_time', value: selFEvent.resolved_time, title: 'Resolved Time', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'in_channel', value: selFEvent.in_channel_alias, title: 'Inbound Channel', width: 50, type: DataTypeEnum.STRING },
      { key: 'out_channel', value: selFEvent.out_channel_alias, title: 'Outbound Channel', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'in_msatoshi', value: selFEvent.in_msatoshi, title: 'In (mSats)', width: 50, type: DataTypeEnum.NUMBER },
      { key: 'out_msatoshi', value: selFEvent.out_msatoshi, title: 'Out (mSats)', width: 50, type: DataTypeEnum.NUMBER }]
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

  loadForwardingEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.forwardingHistoryEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.forwardingHistoryEvents.filterPredicate = (event: ForwardingEvent, fltr: string) => {
      const newEvent = (event.received_time ? this.datePipe.transform(new Date(event.received_time * 1000), 'dd/MMM/YYYY HH:mm')?.toLowerCase() + ' ' : '') +
        (event.resolved_time ? this.datePipe.transform(new Date(event.resolved_time * 1000), 'dd/MMM/YYYY HH:mm')?.toLowerCase() + ' ' : '') +
        (event.in_channel ? event.in_channel.toLowerCase() + ' ' : '') + (event.out_channel ? event.out_channel.toLowerCase() + ' ' : '') +
        (event.in_channel_alias ? event.in_channel_alias.toLowerCase() + ' ' : '') + (event.out_channel_alias ? event.out_channel_alias.toLowerCase() + ' ' : '') +
        (event.in_msatoshi ? (event.in_msatoshi / 1000) + ' ' : '') + (event.out_msatoshi ? (event.out_msatoshi / 1000) + ' ' : '') + (event.fee ? event.fee + ' ' : '');
      return newEvent.includes(fltr);
    };
    this.forwardingHistoryEvents.paginator = this.paginator;
    this.applyFilter();    
    this.logger.info(this.forwardingHistoryEvents);
  }

  onDownloadCSV() {
    if (this.forwardingHistoryEvents && this.forwardingHistoryEvents.data && this.forwardingHistoryEvents.data.length > 0) {
      this.commonService.downloadFile(this.forwardingHistoryEvents.data, 'Forwarding-history');
    }
  }

  applyFilter() {
    if (this.forwardingHistoryEvents) {
      this.forwardingHistoryEvents.filter = this.filterValue.trim().toLowerCase();
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

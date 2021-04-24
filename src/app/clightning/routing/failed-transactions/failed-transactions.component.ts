import { Component, OnInit, OnChanges, ViewChild, Input, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ForwardingEvent } from '../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-failed-history',
  templateUrl: './failed-transactions.component.html',
  styleUrls: ['./failed-transactions.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class CLFailedTransactionsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  public failedEvents: any;
  public errorMessage = '';
  public displayedColumns: any[] = [];
  public forwardingHistoryEvents: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['status', 'in_msatoshi', 'out_msatoshi', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['status', 'in_msatoshi', 'out_msatoshi', 'fee', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['status', 'received_time', 'resolved_time', 'in_channel', 'out_channel', 'in_msatoshi', 'out_msatoshi', 'fee', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'GetForwardingHistory') {
          this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
        }
      });
      this.failedEvents = (rtlStore.forwardingHistory && rtlStore.forwardingHistory.forwarding_events && rtlStore.forwardingHistory.forwarding_events.length > 0) ? this.filterFailedEvents(rtlStore.forwardingHistory.forwarding_events) : [];
      this.loadForwardingEventsTable(this.failedEvents);
      this.logger.info(rtlStore);
    });
  }

  ngAfterViewInit() {
    if (this.failedEvents.length > 0) {
      this.loadForwardingEventsTable(this.failedEvents);
    }
  }

  filterFailedEvents(events) {
    return events.filter(event => event.status !== 'settled');
  }

  onForwardingEventClick(selFEvent: ForwardingEvent, event: any) {
    const reorderedFHEvent = [
      [{key: 'payment_hash', value: selFEvent.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'received_time_str', value: selFEvent.received_time_str, title: 'Received Time', width: 50, type: DataTypeEnum.DATE_TIME},
        {key: 'resolved_time_str', value: selFEvent.resolved_time_str, title: 'Resolved Time', width: 50, type: DataTypeEnum.DATE_TIME}],
      [{key: 'in_channel', value: selFEvent.in_channel_alias ? selFEvent.in_channel_alias : selFEvent.in_channel, title: 'Inbound Channel', width: 50, type: DataTypeEnum.STRING},
        {key: 'out_channel', value: selFEvent.out_channel_alias ? selFEvent.out_channel_alias : selFEvent.out_channel, title: 'Outbound Channel', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'status', value: (selFEvent.status=== 'settled' ? 'Settled' : 'Unsettled'), title: 'Status', width: 50, type: DataTypeEnum.STRING},
        {key: 'fee', value: selFEvent.fee, title: 'Fee (mSats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'in_msatoshi', value: selFEvent.in_msatoshi, title: 'In (mSats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'out_msatoshi', value: selFEvent.out_msatoshi, title: 'Out (mSats)', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Event Information',
      message: reorderedFHEvent
    }}));
  }

  loadForwardingEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.forwardingHistoryEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.forwardingHistoryEvents.paginator = this.paginator;
    this.forwardingHistoryEvents.filterPredicate = (event: ForwardingEvent, fltr: string) => {
      const newEvent = (event.status ? event.status.toLowerCase() : '') + (event.received_time_str ? event.received_time_str.toLowerCase() : '') + (event.resolved_time_str ? event.resolved_time_str.toLowerCase() : '') + (event.in_channel ? event.in_channel.toLowerCase() : '') + (event.out_channel ? event.out_channel.toLowerCase() : '') + (event.in_msatoshi ? (event.in_msatoshi/1000) : '') + (event.out_msatoshi ? (event.out_msatoshi/1000) : '') + (event.fee ? event.fee : '');
      return newEvent.includes(fltr);
    };    
    this.logger.info(this.forwardingHistoryEvents);
  }

  onDownloadCSV() {
    if(this.forwardingHistoryEvents.data && this.forwardingHistoryEvents.data.length > 0) {
      this.commonService.downloadFile(this.forwardingHistoryEvents.data, 'Failed-transactions');
    }
  }

  applyFilter(selFilter: any) {
    this.forwardingHistoryEvents.filter = selFilter.value.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

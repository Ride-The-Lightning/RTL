import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ForwardingEvent, GetInfo, ListForwards } from '../../../shared/models/clnModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum, CLNForwardingEventsStatusEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getForwardingHistory } from '../../store/cln.actions';
import { clnNodeInformation, failedForwardingHistory } from '../../store/cln.selector';

@Component({
  selector: 'rtl-cln-failed-history',
  templateUrl: './failed-transactions.component.html',
  styleUrls: ['./failed-transactions.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Failed events') }
  ]
})
export class CLNFailedTransactionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public flgCompatible = true;
  public information: GetInfo = {};
  public failedEvents: any;
  public errorMessage = '';
  public displayedColumns: any[] = [];
  public failedForwardingEvents: any;
  public flgSticky = false;
  public selFilter = '';
  private indexOffset = -1;
  public totalFailedTransactions = 0;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public apiCallStatus: ApiCallStatusPayload = null;
  public apiCallStatusEnum = APICallStatusEnum;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<RTLState>, private datePipe: DatePipe, private router: Router) {
    this.screenSize = this.commonService.getScreenSize();
    if (this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['received_time', 'in_channel', 'in_msatoshi', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['received_time', 'in_channel', 'out_channel', 'in_msatoshi', 'out_msatoshi', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['received_time', 'resolved_time', 'in_channel', 'out_channel', 'in_msatoshi', 'out_msatoshi', 'fee', 'actions'];
    }
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.store.dispatch(getForwardingHistory({ payload: { status: CLNForwardingEventsStatusEnum.FAILED, maxLen: this.pageSize, offset: 0 } }));
    this.store.select(failedForwardingHistory).pipe(takeUntil(this.unSubs[0]),
      withLatestFrom(this.store.select(clnNodeInformation))).
      subscribe(([ffhSeletor, nodeInfo]: [{ failedForwardingHistory: ListForwards, apiCallStatus: ApiCallStatusPayload }, GetInfo]) => {
        this.information = nodeInfo;
        this.flgCompatible = (this.information.api_version) ? this.commonService.isVersionCompatible(this.information.api_version, '0.7.3') : true;
        this.errorMessage = '';
        this.apiCallStatus = ffhSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.totalFailedTransactions = ffhSeletor.failedForwardingHistory.totalForwards;
        this.indexOffset = ffhSeletor.failedForwardingHistory.offset;
        this.failedEvents = ffhSeletor.failedForwardingHistory.listForwards || [];
        if (this.failedEvents.length > 0 && this.sort && this.paginator) {
          if (this.flgCompatible) {
            this.loadFailedEventsTable(this.failedEvents);
          } else {
            this.loadFailedEventsTable(this.failedEvents.slice(0, this.pageSize));
          }
        }
        this.logger.info(ffhSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.failedEvents.length > 0) {
      if (this.flgCompatible) {
        this.loadFailedEventsTable(this.failedEvents);
      } else {
        this.loadFailedEventsTable(this.failedEvents.slice(0, this.pageSize));
      }
    }
  }

  onFailedEventClick(selFEvent: ForwardingEvent) {
    const reorderedFHEvent = [
      [{ key: 'received_time', value: selFEvent.received_time, title: 'Received Time', width: 50, type: DataTypeEnum.DATE_TIME },
      { key: 'resolved_time', value: selFEvent.resolved_time, title: 'Resolved Time', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'in_channel_alias', value: selFEvent.in_channel_alias, title: 'Inbound Channel', width: 50, type: DataTypeEnum.STRING },
      { key: 'out_channel_alias', value: selFEvent.out_channel_alias, title: 'Outbound Channel', width: 50, type: DataTypeEnum.STRING }],
      [{ key: 'in_msatoshi', value: selFEvent.in_msatoshi, title: 'Amount In (mSats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'out_msatoshi', value: selFEvent.out_msatoshi, title: 'Amount Out (mSats)', width: 33, type: DataTypeEnum.NUMBER },
      { key: 'fee', value: selFEvent.fee, title: 'Fee (mSats)', width: 34, type: DataTypeEnum.NUMBER }]
    ];
    if (selFEvent.payment_hash) {
      reorderedFHEvent.unshift([{ key: 'payment_hash', value: selFEvent.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }]);
    }
    this.store.dispatch(openAlert({
      payload: {
        data: {
          type: AlertTypeEnum.INFORMATION,
          alertTitle: 'Failed Event Information',
          message: reorderedFHEvent
        }
      }
    }));
  }

  loadFailedEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.failedForwardingEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.failedForwardingEvents.sort = this.sort;
    this.failedForwardingEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.failedForwardingEvents.filterPredicate = (event: ForwardingEvent, fltr: string) => {
      const newEvent = ((event.received_time ? this.datePipe.transform(new Date(event.received_time * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') +
        (event.resolved_time ? this.datePipe.transform(new Date(event.resolved_time * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') +
        (event.payment_hash ? event.payment_hash.toLowerCase() : '') +
        (event.in_channel ? event.in_channel.toLowerCase() : '') + (event.out_channel ? event.out_channel.toLowerCase() : '') +
        (event.in_channel_alias ? event.in_channel_alias.toLowerCase() : '') + (event.out_channel_alias ? event.out_channel_alias.toLowerCase() : '') +
        (event.in_msatoshi ? (event.in_msatoshi / 1000) : '') + (event.out_msatoshi ? (event.out_msatoshi / 1000) : '') + (event.fee ? event.fee : ''));
      return newEvent.includes(fltr);
    };
    this.applyFilter();
    this.logger.info(this.failedForwardingEvents);
  }

  onDownloadCSV() {
    if (this.failedForwardingEvents && this.failedForwardingEvents.data && this.failedForwardingEvents.data.length > 0) {
      this.commonService.downloadFile(this.failedForwardingEvents.data, 'Failed-transactions');
    }
  }

  applyFilter() {
    this.failedForwardingEvents.filter = this.selFilter.trim().toLowerCase();
  }

  onPageChange(event: PageEvent) {
    if (this.pageSize !== event.pageSize) {
      this.pageSize = event.pageSize;
      this.indexOffset = 0;
    } else {
      this.indexOffset = event.pageIndex * this.pageSize;
    }
    if (this.flgCompatible) {
      this.store.dispatch(getForwardingHistory({ payload: { status: CLNForwardingEventsStatusEnum.FAILED, maxLen: this.pageSize, offset: this.indexOffset } }));
    } else {
      this.loadFailedEventsTable(this.failedEvents.slice(this.indexOffset, (this.indexOffset + this.pageSize)));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

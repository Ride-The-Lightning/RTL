import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ForwardingEvent } from '../../../shared/models/clModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum, APICallStatusEnum } from '../../../shared/services/consts-enums-functions';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import { RTLState } from '../../../store/rtl.state';
import { openAlert } from '../../../store/rtl.actions';
import { getFailedForwardingHistory } from '../../store/cl.actions';
import { failedForwardingHistory } from '../../store/cl.selector';

@Component({
  selector: 'rtl-cl-failed-history',
  templateUrl: './failed-transactions.component.html',
  styleUrls: ['./failed-transactions.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class CLFailedTransactionsComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatSort, { static: false }) sort: MatSort | undefined;
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator | undefined;
  public failedEvents: any;
  public errorMessage = '';
  public displayedColumns: any[] = [];
  public failedForwardingEvents: any;
  public flgSticky = false;
  public selFilter = '';
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
      this.displayedColumns = ['status', 'received_time', 'in_msatoshi', 'actions'];
    } else if (this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['status', 'received_time', 'in_msatoshi', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['status', 'received_time', 'in_channel', 'out_channel', 'in_msatoshi', 'actions'];
    }
  }

  ngOnInit() {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.store.dispatch(getFailedForwardingHistory());
    this.store.select(failedForwardingHistory).pipe(takeUntil(this.unSubs[0])).
      subscribe((ffhSeletor: { failedForwardingHistory: ForwardingEvent[], apiCallStatus: ApiCallStatusPayload }) => {
        this.errorMessage = '';
        this.apiCallStatus = ffhSeletor.apiCallStatus;
        if (this.apiCallStatus.status === APICallStatusEnum.ERROR) {
          this.errorMessage = (typeof (this.apiCallStatus.message) === 'object') ? JSON.stringify(this.apiCallStatus.message) : this.apiCallStatus.message;
        }
        this.failedEvents = ffhSeletor.failedForwardingHistory || [];
        if (this.failedEvents.length > 0 && this.sort && this.paginator) {
          this.loadFailedEventsTable(this.failedEvents);
        }
        this.logger.info(ffhSeletor);
      });
  }

  ngAfterViewInit() {
    if (this.failedEvents.length > 0) {
      this.loadFailedEventsTable(this.failedEvents);
    }
  }

  onFailedEventClick(selFEvent: ForwardingEvent) {
    const reorderedFHEvent = [
      [{ key: 'payment_hash', value: selFEvent.payment_hash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING }],
      [{ key: 'status', value: selFEvent.status === 'local_failed' ? 'Local Failed' : this.commonService.titleCase(selFEvent.status), title: 'Status', width: 50, type: DataTypeEnum.STRING },
      { key: 'received_time', value: selFEvent.received_time, title: 'Received Time', width: 50, type: DataTypeEnum.DATE_TIME }],
      [{ key: 'in_channel', value: selFEvent.in_channel_alias, title: 'Inbound Channel', width: 50, type: DataTypeEnum.STRING },
      { key: 'out_channel', value: selFEvent.out_channel_alias, title: 'Outbound Channel', width: 50, type: DataTypeEnum.STRING },
      { key: 'in_msatoshi', value: selFEvent.in_msatoshi, title: 'In (mSats)', width: 50, type: DataTypeEnum.NUMBER }]
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

  loadFailedEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.failedForwardingEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.failedForwardingEvents.sort = this.sort;
    this.failedForwardingEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => ((data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null);
    this.failedForwardingEvents.paginator = this.paginator;
    this.failedForwardingEvents.filterPredicate = (event: ForwardingEvent, fltr: string) => {
      const newEvent = (event.status ? (event.status === 'local_failed') ? 'local failed' : event.status.toLowerCase() : '') +
        (event.received_time ? this.datePipe.transform(new Date(event.received_time * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') +
        (event.resolved_time ? this.datePipe.transform(new Date(event.resolved_time * 1000), 'dd/MMM/YYYY HH:mm').toLowerCase() : '') +
        (event.in_channel ? event.in_channel.toLowerCase() : '') + (event.out_channel ? event.out_channel.toLowerCase() : '') +
        (event.in_msatoshi ? (event.in_msatoshi / 1000) : '') + (event.out_msatoshi ? (event.out_msatoshi / 1000) : '') + (event.fee ? event.fee : '');
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

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

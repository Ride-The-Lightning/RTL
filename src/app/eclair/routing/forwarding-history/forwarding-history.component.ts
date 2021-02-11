import { Component, OnInit, OnChanges, AfterViewInit, ViewChild, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { PaymentRelayed } from '../../../shared/models/eclModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class ECLForwardingHistoryComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  @Input() eventsData = [];
  @Input() filterValue = '';
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
      this.displayedColumns = ['timestamp', 'amountIn', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amountIn', 'fee', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amountIn', 'amountOut', 'fee', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['timestamp', 'fromChannelAlias', 'toChannelAlias', 'amountIn', 'amountOut', 'fee', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore: any) => {
      if (this.eventsData.length <= 0) {
        this.errorMessage = '';
        rtlStore.effectErrors.forEach(effectsErr => {
          if (effectsErr.action === 'FetchPayments') {
            this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
          }
        });
        this.eventsData = rtlStore.payments && rtlStore.payments.relayed ? rtlStore.payments.relayed : [];
        if (this.eventsData.length > 0 && this.sort && this.paginator) {
          this.loadForwardingEventsTable(this.eventsData);
        }        
        this.logger.info(this.eventsData);
      }
    });
  }

  ngAfterViewInit() {
    if (this.eventsData.length > 0) {
      this.loadForwardingEventsTable(this.eventsData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventsData) {
      this.eventsData = changes.eventsData.currentValue;
      this.loadForwardingEventsTable(this.eventsData);
    }
    if (changes.filterValue) {
      this.applyFilter();
    }
  }

  onForwardingEventClick(selFEvent: PaymentRelayed, event: any) {
    const reorderedFHEvent = [
      [{key: 'paymentHash', value: selFEvent.paymentHash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'timestampStr', value: selFEvent.timestampStr, title: 'Date/Time', width: 50, type: DataTypeEnum.DATE_TIME},
        {key: 'fee', value: (selFEvent.amountIn - selFEvent.amountOut), title: 'Fee Earned (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'amountIn', value: selFEvent.amountIn, title: 'Amount In (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'amountOut', value: selFEvent.amountOut, title: 'Amount Out (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'fromChannelAlias', value: selFEvent.fromChannelAlias, title: 'From Channel Alias', width: 50, type: DataTypeEnum.STRING},
        {key: 'fromShortChannelId', value: selFEvent.fromShortChannelId, title: 'From Short Channel ID', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'fromChannelId', value: selFEvent.fromChannelId, title: 'From Channel Id', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'toChannelAlias', value: selFEvent.toChannelAlias, title: 'To Channel Alias', width: 50, type: DataTypeEnum.STRING},
        {key: 'toShortChannelId', value: selFEvent.toShortChannelId, title: 'To Short Channel ID', width: 50, type: DataTypeEnum.STRING}],
      [{key: 'toChannelId', value: selFEvent.toChannelId, title: 'To Channel Id', width: 100, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Event Information',
      message: reorderedFHEvent
    }}));
  }

  loadForwardingEventsTable(forwardingEvents: PaymentRelayed[]) {
    this.forwardingHistoryEvents = new MatTableDataSource<PaymentRelayed>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'fee':
          return data.amountIn - data.amountOut;
      
        default:
          return (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
      }
    }
    this.forwardingHistoryEvents.filterPredicate = (fwhev: PaymentRelayed, fltr: string) => JSON.stringify(fwhev).toLowerCase().includes(fltr);
    this.forwardingHistoryEvents.paginator = this.paginator;
    this.logger.info(this.forwardingHistoryEvents);
  }

  onDownloadCSV() {
    if(this.forwardingHistoryEvents.data && this.forwardingHistoryEvents.data.length > 0) {
      this.commonService.downloadFile(this.forwardingHistoryEvents.data, 'Forwarding-history');
    }
  }

  applyFilter() {
    this.forwardingHistoryEvents.filter = this.filterValue.trim().toLowerCase();
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

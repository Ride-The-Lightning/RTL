import { Component, OnInit, OnChanges, ViewChild, Input } from '@angular/core';
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
export class ECLForwardingHistoryComponent implements OnInit, OnChanges {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @Input() successfulEvents: any;
  public displayedColumns = [];
  public forwardingHistoryEvents: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;

  constructor(private logger: LoggerService, private commonService: CommonService, private store: Store<fromRTLReducer.RTLState>) {
    this.screenSize = this.commonService.getScreenSize();
    if(this.screenSize === ScreenSizeEnum.XS) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amountIn', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amountIn', 'amountOut', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['timestamp', 'amountIn', 'amountOut', 'paymentHash', 'actions'];
    }
  }

  ngOnInit() {}

  ngOnChanges() {
    this.loadForwardingEventsTable(this.successfulEvents);
  }

  onForwardingEventClick(selFEvent: PaymentRelayed, event: any) {
    const reorderedFHEvent = [
      [{key: 'timestampStr', value: selFEvent.timestampStr, title: 'Date/Time', width: 34, type: DataTypeEnum.DATE_TIME},
        {key: 'amountIn', value: selFEvent.amountIn, title: 'Amount In (Sats)', width: 33, type: DataTypeEnum.NUMBER},
        {key: 'amountOut', value: selFEvent.amountOut, title: 'Amount Out (Sats)', width: 33, type: DataTypeEnum.NUMBER}],
      [{key: 'paymentHash', value: selFEvent.paymentHash, title: 'Payment Hash', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'fromChannelId', value: selFEvent.fromChannelId, title: 'From Channel Id', width: 100, type: DataTypeEnum.STRING}],
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
    this.forwardingHistoryEvents.sortingDataAccessor = (data, sortHeaderId) => (data[sortHeaderId]  && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : +data[sortHeaderId];
    this.forwardingHistoryEvents.paginator = this.paginator;
    this.forwardingHistoryEvents.filterPredicate = (event: PaymentRelayed, fltr: string) => {
      const newEvent = event.amountIn + event.amountOut + event.paymentHash + event.fromChannelId + event.toChannelId + event.timestampStr;
      return newEvent.includes(fltr.toLowerCase());
    };    
    this.logger.info(this.forwardingHistoryEvents);
  }

  onDownloadCSV() {
    if(this.forwardingHistoryEvents.data && this.forwardingHistoryEvents.data.length > 0) {
      this.commonService.downloadFile(this.forwardingHistoryEvents.data, 'Forwarding-history');
    }
  }

  applyFilter(selFilter: string) {
    this.forwardingHistoryEvents.filter = selFilter;
  }

}

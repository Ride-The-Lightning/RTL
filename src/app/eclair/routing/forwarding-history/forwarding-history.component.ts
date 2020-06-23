import { Component, OnInit, OnChanges, ViewChild, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ChannelStats } from '../../../shared/models/eclrModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-eclr-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class ECLRForwardingHistoryComponent implements OnInit, OnChanges {
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
      this.displayedColumns = ['channelId', 'avgPaymentAmount', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['channelId', 'paymentCount', 'avgPaymentAmount', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['channelId', 'paymentCount', 'avgPaymentAmount', 'relayFee', 'networkFee', 'actions'];
    }
  }

  ngOnInit() {}

  ngOnChanges() {
    this.loadForwardingEventsTable(this.successfulEvents);
  }

  onForwardingEventClick(selFEvent: any, event: any) {
    const reorderedFHEvent = [
      [{key: 'channelId', value: selFEvent.channelId, title: 'Channel ID', width: 100, type: DataTypeEnum.STRING}],
      [{key: 'paymentCount', value: selFEvent.paymentCount, title: 'Payment Count', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'avgPaymentAmount', value: selFEvent.avgPaymentAmount, title: 'Avg. Payment Amount (Sats)', width: 50, type: DataTypeEnum.NUMBER}],
      [{key: 'relayFee', value: selFEvent.relayFee, title: 'Relay Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER},
        {key: 'networkFee', value: selFEvent.networkFee, title: 'Network Fee (Sats)', width: 50, type: DataTypeEnum.NUMBER}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Event Information',
      message: reorderedFHEvent
    }}));
  }

  loadForwardingEventsTable(forwardingEvents: ChannelStats[]) {
    this.forwardingHistoryEvents = new MatTableDataSource<ChannelStats>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.paginator = this.paginator;
    this.forwardingHistoryEvents.filterPredicate = (event: ChannelStats, fltr: string) => {
      const newEvent = event.channelId + event.avgPaymentAmount + event.paymentCount + event.relayFee + event.networkFee;
      return newEvent.includes(fltr.toLowerCase());
    };    
    this.logger.info(this.forwardingHistoryEvents);
  }

  onDownloadCSV() {
    if(this.forwardingHistoryEvents.data && this.forwardingHistoryEvents.data.length > 0) {
      this.commonService.downloadCSV(this.forwardingHistoryEvents.data, 'Forwarding-history');
    }
  }

  applyFilter(selFilter: string) {
    this.forwardingHistoryEvents.filter = selFilter;
  }

}

import { Component, OnInit, OnChanges, ViewChild, Input, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { MatPaginator, MatPaginatorIntl } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { ForwardingEvent } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum, ScreenSizeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss'],
  providers: [
    { provide: MatPaginatorIntl, useValue: getPaginatorLabel('Events') }
  ]
})
export class ForwardingHistoryComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild(MatSort, { static: false }) sort: MatSort|undefined;
  @ViewChild(MatPaginator, {static: false}) paginator: MatPaginator|undefined;
  @Input() eventsData = [];
  @Input() filterValue = '';
  public forwardingHistoryData = [];
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
      this.displayedColumns = ['timestamp', 'fee_msat', 'actions'];
    } else if(this.screenSize === ScreenSizeEnum.SM || this.screenSize === ScreenSizeEnum.MD) {
      this.flgSticky = false;
      this.displayedColumns = ['timestamp', 'amt_in', 'amt_out', 'fee_msat', 'actions'];
    } else {
      this.flgSticky = true;
      this.displayedColumns = ['timestamp', 'alias_in', 'alias_out', 'amt_in', 'amt_out', 'fee_msat', 'actions'];
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      if (this.eventsData.length <= 0) {
        this.errorMessage = '';
        rtlStore.effectErrors.forEach(effectsErr => {
          if (effectsErr.action === 'GetForwardingHistory') {
            this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
          }
        });
        this.forwardingHistoryData = (rtlStore.forwardingHistory && rtlStore.forwardingHistory.forwarding_events) ? rtlStore.forwardingHistory.forwarding_events : [];
        this.loadForwardingEventsTable(this.forwardingHistoryData);
        this.logger.info(rtlStore);
      }
    });
  }

  ngAfterViewInit() {
    if (this.forwardingHistoryData.length > 0) {
      this.loadForwardingEventsTable(this.forwardingHistoryData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.eventsData) {
      this.eventsData = changes.eventsData.currentValue;
      this.forwardingHistoryData = this.eventsData;
      this.loadForwardingEventsTable(this.forwardingHistoryData);
    }
    if (changes.filterValue) {
      this.applyFilter();
    }
  }

  onForwardingEventClick(selFEvent: ForwardingEvent, event: any) {
    const reorderedFHEvent = [
      [{key: 'timestamp_str', value: selFEvent.timestamp_str, title: 'Timestamp', width: 25, type: DataTypeEnum.DATE_TIME},
        {key: 'amt_in', value: selFEvent.amt_in, title: 'Inbound Amount (Sats)', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'amt_out', value: selFEvent.amt_out, title: 'Outbound Amount (Sats)', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'fee_msat', value: selFEvent.fee_msat, title: 'Fee (mSats)', width: 25, type: DataTypeEnum.NUMBER}],
      [{key: 'alias_in', value: selFEvent.alias_in, title: 'Inbound Peer Alias', width: 25, type: DataTypeEnum.STRING},
        {key: 'chan_id_in', value: selFEvent.chan_id_in, title: 'Inbound Channel ID', width: 25, type: DataTypeEnum.STRING},
        {key: 'alias_out', value: selFEvent.alias_out, title: 'Outbound Peer Alias', width: 25, type: DataTypeEnum.STRING},
        {key: 'chan_id_out', value: selFEvent.chan_id_out, title: 'Outbound Channel ID', width: 25, type: DataTypeEnum.STRING}]
    ];
    this.store.dispatch(new RTLActions.OpenAlert({ data: {
      type: AlertTypeEnum.INFORMATION,
      alertTitle: 'Event Information',
      message: reorderedFHEvent
    }}));
  }

  loadForwardingEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.forwardingHistoryEvents = forwardingEvents ? new MatTableDataSource<ForwardingEvent>([...forwardingEvents]) : new MatTableDataSource([]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.sortingDataAccessor = (data: any, sortHeaderId: string) => (data[sortHeaderId] && isNaN(data[sortHeaderId])) ? data[sortHeaderId].toLocaleLowerCase() : data[sortHeaderId] ? +data[sortHeaderId] : null;
    this.forwardingHistoryEvents.filterPredicate = (fhEvents: ForwardingEvent, fltr: string) => JSON.stringify(fhEvents).toLowerCase().includes(fltr);
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

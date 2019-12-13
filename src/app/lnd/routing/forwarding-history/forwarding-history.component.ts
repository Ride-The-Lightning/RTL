import { Component, OnInit, OnChanges, ViewChild, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import { MatTableDataSource, MatSort, MatPaginator, MatPaginatorIntl } from '@angular/material';
import { ForwardingEvent } from '../../../shared/models/lndModels';
import { PAGE_SIZE, PAGE_SIZE_OPTIONS, getPaginatorLabel, AlertTypeEnum, DataTypeEnum } from '../../../shared/services/consts-enums-functions';
import { LoggerService } from '../../../shared/services/logger.service';

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
export class ForwardingHistoryComponent implements OnInit, OnChanges {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @Input() forwardingHistoryData: any;
  public displayedColumns = [];
  public forwardingHistoryEvents: any;
  public flgSticky = false;
  public pageSize = PAGE_SIZE;
  public pageSizeOptions = PAGE_SIZE_OPTIONS;

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['timestamp', 'fee', 'actions'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['timestamp', 'chan_id_in', 'chan_id_out', 'fee', 'actions'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['timestamp', 'chan_id_in', 'chan_id_out', 'fee', 'actions'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['timestamp', 'chan_id_in', 'chan_id_out', 'fee', 'actions'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['timestamp', 'chan_id_in', 'chan_id_out', 'fee', 'actions'];
        break;
    }
  }

  ngOnInit() {}

  ngOnChanges() {
    this.loadForwardingEventsTable(this.forwardingHistoryData);
  }

  onForwardingEventClick(selRow: ForwardingEvent, event: any) {
    const selFEvent = this.forwardingHistoryEvents.data.filter(fhEvent => {
      return (fhEvent.chan_id_in === selRow.chan_id_in && fhEvent.timestamp === selRow.timestamp);
    })[0];
    const reorderedFHEvent = [
      [{key: 'timestamp_str', value: selFEvent.timestamp_str, title: 'Timestamp', width: 25, type: DataTypeEnum.DATE_TIME},
        {key: 'amt_in', value: selFEvent.amt_in, title: 'Inbound Amount (Sats)', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'amt_out', value: selFEvent.amt_out, title: 'Outbound Amount (Sats)', width: 25, type: DataTypeEnum.NUMBER},
        {key: 'fee', value: selFEvent.fee, title: 'Fee (Sats)', width: 25, type: DataTypeEnum.NUMBER}],
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
    this.forwardingHistoryEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.paginator = this.paginator;
    this.logger.info(this.forwardingHistoryEvents);
  }

  applyFilter(selFilter: string) {
    this.forwardingHistoryEvents.filter = selFilter;
  }

}

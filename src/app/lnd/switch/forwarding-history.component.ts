import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { formatDate } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { ForwardingEvent } from '../../shared/models/lndModels';
import { LoggerService } from '../../shared/services/logger.service';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss']
})
export class ForwardingHistoryComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public displayedColumns = [];
  public forwardingHistoryEvents: any;
  public lastOffsetIndex = 0;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public today = new Date(Date.now());
  public yesterday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1, this.today.getHours(), this.today.getMinutes(), this.today.getSeconds());
  public endDate = this.today;
  public startDate = this.yesterday;
  public flgSticky = false;
  private unsub: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['timestamp', 'amt_out', 'amt_in'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['timestamp', 'amt_out', 'amt_in', 'fee'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['timestamp', 'chan_id_in', 'chan_id_out', 'amt_out', 'amt_in', 'fee'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['timestamp', 'chan_id_in', 'chan_id_out', 'amt_out', 'amt_in', 'fee'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['timestamp', 'chan_id_in', 'chan_id_out', 'amt_out', 'amt_in', 'fee'];
        break;
    }
  }

  ngOnInit() {
    this.onForwardingHistoryFetch();
    this.store.select('lnd')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'GetForwardingHistory') {
          this.flgLoading[0] = 'error';
        }
      });
      if (undefined !== rtlStore.forwardingHistory && undefined !== rtlStore.forwardingHistory.forwarding_events) {
        this.lastOffsetIndex = rtlStore.forwardingHistory.last_offset_index;
        this.loadForwardingEventsTable(rtlStore.forwardingHistory.forwarding_events);
      } else {
        // To reset table after other Forwarding history calls
        this.lastOffsetIndex = 0;
        this.loadForwardingEventsTable([]);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== rtlStore.forwardingHistory) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onForwardingEventClick(selRow: ForwardingEvent, event: any) {
    const selFEvent = this.forwardingHistoryEvents.data.filter(fhEvent => {
      return (fhEvent.chan_id_in === selRow.chan_id_in && fhEvent.timestamp === selRow.timestamp);
    })[0];
    const reorderedFHEvent = JSON.parse(JSON.stringify(selFEvent, ['timestamp_str', 'chan_id_in', 'alias_in', 'chan_id_out', 'alias_out', 'amt_out', 'amt_in', 'fee'] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedFHEvent)
    }}));
  }

  loadForwardingEventsTable(forwardingEvents: ForwardingEvent[]) {
    this.forwardingHistoryEvents = new MatTableDataSource<ForwardingEvent>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.forwardingHistoryEvents.data.forEach(event => {
      event.timestamp_str = (event.timestamp_str === '') ? '' : formatDate(event.timestamp_str, 'dd/MMM/yyyy HH:mm', 'en-US');
    });

    this.logger.info(this.forwardingHistoryEvents);
  }

  onForwardingHistoryFetch() {
    if (undefined === this.endDate || this.endDate == null) {
      this.endDate = new Date();
    }
    if (undefined === this.startDate || this.startDate == null) {
      this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 1);
    }
    this.store.dispatch(new RTLActions.GetForwardingHistory({
      end_time: Math.round(this.endDate.getTime() / 1000).toString(),
      start_time: Math.round(this.startDate.getTime() / 1000).toString()
    }));
  }

  resetData() {
    this.endDate = new Date();
    this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 1);
    if (undefined !== this.forwardingHistoryEvents) {
      this.forwardingHistoryEvents.data = [];
    }
  }

  ngOnDestroy() {
    this.resetData();
    this.store.dispatch(new RTLActions.SetForwardingHistory({}));
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

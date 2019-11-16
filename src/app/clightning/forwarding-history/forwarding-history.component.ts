import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { ForwardingEventCL } from '../../shared/models/clModels';
import { LoggerService } from '../../shared/services/logger.service';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-forwarding-history',
  templateUrl: './forwarding-history.component.html',
  styleUrls: ['./forwarding-history.component.scss']
})
export class CLForwardingHistoryComponent implements OnInit, OnDestroy {
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
        this.displayedColumns = ['status', 'in_msatoshi', 'out_msatoshi'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['status', 'in_msatoshi', 'out_msatoshi', 'fee'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['status', 'received_time_str', 'resolved_time_str', 'in_channel', 'out_channel', 'in_msatoshi', 'out_msatoshi', 'fee', 'payment_hash'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['status', 'received_time_str', 'resolved_time_str', 'in_channel', 'out_channel', 'in_msatoshi', 'out_msatoshi', 'fee', 'payment_hash'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['status', 'received_time_str', 'resolved_time_str', 'in_channel', 'out_channel', 'in_msatoshi', 'out_msatoshi', 'fee', 'payment_hash'];
        break;
    }
  }

  ngOnInit() {
    this.onForwardingHistoryFetchCL();
    this.store.select('cl')
    .pipe(takeUntil(this.unsub[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'GetForwardingHistoryCL') {
          this.flgLoading[0] = 'error';
        }
      });
      if (undefined !== rtlStore.forwardingHistory.forwarding_events && rtlStore.forwardingHistory.forwarding_events.length > 0) {
        this.lastOffsetIndex = rtlStore.forwardingHistory.last_offset_index;
        this.loadForwardingEventsTable(rtlStore.forwardingHistory.forwarding_events);
      } else {
        // To reset table after other Forwarding history calls
        this.lastOffsetIndex = 0;
        this.loadForwardingEventsTable([]);
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== rtlStore.forwardingHistory.forwarding_events) ? false : true;
      }
      this.logger.info(rtlStore);
    });

  }

  onForwardingEventClick(selRow: ForwardingEventCL, event: any) {
    const selFEvent = this.forwardingHistoryEvents.data.filter(fhEvent => {
      return (fhEvent.received_time === selRow.received_time && fhEvent.in_channel === selRow.in_channel);
    })[0];
    const reorderedFHEvent = JSON.parse(JSON.stringify(selFEvent, [
      'status', 'received_time_str', 'resolved_time_str', 'in_channel', 'out_channel', 'in_msatoshi', 'in_msat', 'out_msatoshi', 'out_msat', 'fee', 'fee_msat', 'payment_hash'      
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ config: { width: '75%', data: {
      type: 'INFO',
      message: JSON.stringify(reorderedFHEvent)
    }}}));
  }

  loadForwardingEventsTable(forwardingEvents: ForwardingEventCL[]) {
    this.forwardingHistoryEvents = new MatTableDataSource<ForwardingEventCL>([...forwardingEvents]);
    this.forwardingHistoryEvents.sort = this.sort;
    this.logger.info(this.forwardingHistoryEvents);
  }

  onForwardingHistoryFetchCL() {
    if (undefined === this.endDate || this.endDate == null) {
      this.endDate = new Date();
    }
    if (undefined === this.startDate || this.startDate == null) {
      this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 1);
    }
    this.store.dispatch(new RTLActions.GetForwardingHistoryCL(
      // { end_time: Math.round(this.endDate.getTime() / 1000).toString(), start_time: Math.round(this.startDate.getTime() / 1000).toString() }
    ));
  }

  resetData() {
    // this.endDate = new Date();
    // this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 1);
    if (undefined !== this.forwardingHistoryEvents) {
      this.forwardingHistoryEvents.data = [];
    }
  }

  applyFilter(selFilter: string) {
    this.forwardingHistoryEvents.filter = selFilter;
  }

  ngOnDestroy() {
    this.resetData();
    this.unsub.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

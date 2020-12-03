import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faMapSigns } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import * as CLActions from '../store/cl.actions';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';


@Component({
  selector: 'rtl-cl-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class CLRoutingComponent implements OnInit, OnDestroy {
  public faMapSigns = faMapSigns;
  public lastOffsetIndex = 0;
  public successfulData = [];
  public failedData = [];
  public filteredData = false;
  public today = new Date(Date.now());
  public lastMonthDay = new Date(this.today.getFullYear(), this.today.getMonth() - 1, this.today.getDate() + 1, 0, 0, 0);
  public yesterday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1, 0, 0, 0);
  public endDate = this.today;
  public startDate = this.lastMonthDay;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public errorMessage = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  ngOnInit() {
    this.onEventsFetch();
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.filteredData = false;
      this.errorMessage = '';
      rtlStore.effectErrors.forEach(effectsErr => {
        if (effectsErr.action === 'GetForwardingHistory') {
          this.flgLoading[0] = 'error';
          this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
        }
      });
      if (rtlStore.forwardingHistory && rtlStore.forwardingHistory.forwarding_events) {
        this.lastOffsetIndex = rtlStore.forwardingHistory.last_offset_index;
        this.successfulData = [];
        this.failedData = [];
        rtlStore.forwardingHistory.forwarding_events.forEach(event => {
          if (event.status === 'settled') {
            this.successfulData.push(event);
          } else {
            this.failedData.push(event);
          }
        });
        this.filteredData = true;
      } else {
        // To reset table after other Forwarding history calls
        this.lastOffsetIndex = 0;
        this.successfulData = [];
        this.failedData = [];
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = ( rtlStore.forwardingHistory) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  onEventsFetch() {
    if (!this.endDate) { this.endDate = new Date(); }
    if (!this.startDate) { this.startDate = this.lastMonthDay; }
    this.store.dispatch(new CLActions.GetForwardingHistory());
  }

  resetData() {
    this.endDate = new Date();
    this.startDate = this.lastMonthDay;
    this.successfulData = [];
    this.failedData = [];
    this.lastOffsetIndex = 0;
  }

  ngOnDestroy() {
    this.resetData();
    this.store.dispatch(new CLActions.SetForwardingHistory({}));
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

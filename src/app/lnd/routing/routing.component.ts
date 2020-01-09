import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faMapSigns } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';


@Component({
  selector: 'rtl-routing',
  templateUrl: './routing.component.html',
  styleUrls: ['./routing.component.scss']
})
export class RoutingComponent implements OnInit, OnDestroy {
  public faMapSigns = faMapSigns;
  public lastOffsetIndex = 0;
  public eventsData = [];
  public today = new Date(Date.now());
  public lastMonthDay = new Date(
    this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 30,
    this.today.getHours(), this.today.getMinutes(), this.today.getSeconds()
  );
  public yesterday = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() - 1, this.today.getHours(), this.today.getMinutes(), this.today.getSeconds());
  public endDate = this.today;
  public startDate = this.lastMonthDay;
  public flgLoading: Array<Boolean | 'error'> = [true];
  public errorMessage = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  ngOnInit() {
    this.onEventsFetch();
    this.actions$.pipe(takeUntil(this.unSubs[1]), filter((action) => action.type === RTLActions.RESET_LND_STORE))
    .subscribe((resetLndStore: RTLActions.ResetLNDStore) => {
      this.onEventsFetch();
    });
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.errorMessage = '';
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'GetForwardingHistory') {
          this.flgLoading[0] = 'error';
          this.errorMessage = (typeof(effectsErr.message) === 'object') ? JSON.stringify(effectsErr.message) : effectsErr.message;
        }
      });
      if (undefined !== rtlStore.forwardingHistory && undefined !== rtlStore.forwardingHistory.forwarding_events) {
        this.lastOffsetIndex = rtlStore.forwardingHistory.last_offset_index;
        this.eventsData = rtlStore.forwardingHistory.forwarding_events;
      } else {
        // To reset table after other Forwarding history calls
        this.lastOffsetIndex = 0;
        this.eventsData = [];
      }
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = (undefined !== rtlStore.forwardingHistory) ? false : true;
      }
      this.logger.info(rtlStore);
    });
  }

  onEventsFetch() {
    if (undefined === this.endDate || this.endDate == null) {
      this.endDate = new Date();
    }
    if (undefined === this.startDate || this.startDate == null) {
      this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 30);
    }
    this.store.dispatch(new RTLActions.GetForwardingHistory({
      end_time: Math.round(this.endDate.getTime() / 1000).toString(),
      start_time: Math.round(this.startDate.getTime() / 1000).toString()
    }));
  }

  resetData() {
    this.endDate = new Date();
    this.startDate = new Date(this.endDate.getFullYear(), this.endDate.getMonth(), this.endDate.getDate() - 1);
    this.eventsData = [];
    this.lastOffsetIndex = 0;
  }

  ngOnDestroy() {
    this.resetData();
    this.store.dispatch(new RTLActions.SetForwardingHistory({}));
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

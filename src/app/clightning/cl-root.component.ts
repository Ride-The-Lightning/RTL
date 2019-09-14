import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import * as RTLActions from '../store/rtl.actions';
import * as fromRTLReducer from '../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-root',
  templateUrl: './cl-root.component.html',
  styleUrls: ['./cl-root.component.scss']
})
export class CLRootComponent implements OnInit, OnDestroy {
  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchInfoCL());
    this.actions$.pipe(takeUntil(this.unsubs[0]), filter((action) => action.type === RTLActions.SET_INFO_CL))
    .subscribe((infoData: RTLActions.SetInfoCL) => {
      if(infoData.type === RTLActions.SET_INFO_CL && undefined !== infoData.payload.id) {
        this.initializeRemainingData();
      }
    });
  }

  initializeRemainingData() {
    this.store.dispatch(new RTLActions.FetchFeesCL());
    this.store.dispatch(new RTLActions.FetchBalanceCL());
    this.store.dispatch(new RTLActions.FetchLocalRemoteBalanceCL());
    this.store.dispatch(new RTLActions.FetchFeeRatesCL('perkw'));
    this.store.dispatch(new RTLActions.FetchFeeRatesCL('perkb'));
    this.store.dispatch(new RTLActions.FetchPeersCL());
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}

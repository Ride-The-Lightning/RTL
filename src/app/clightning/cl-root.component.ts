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
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
    this.actions$.pipe(takeUntil(this.unsubs[0]), filter((action) => action.type === RTLActions.SET_CL_INFO))
    .subscribe((infoData: RTLActions.SetCLInfo) => {
      if(undefined !== infoData.payload.id) {
        this.initializeRemainingData();
      }
    });
  }

  initializeRemainingData() {
    this.store.dispatch(new RTLActions.FetchCLFees());
    // this.store.dispatch(new RTLActions.FetchPeers());
    // this.store.dispatch(new RTLActions.FetchBalance('channels'));
    // this.store.dispatch(new RTLActions.FetchNetwork());
    // this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'all'}));
    // this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'pending'}));
    // this.store.dispatch(new RTLActions.FetchInvoices({num_max_invoices: 25, reversed: true}));
    // this.store.dispatch(new RTLActions.FetchPayments());
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}

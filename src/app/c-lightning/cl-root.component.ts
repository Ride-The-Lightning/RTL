import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import * as CLActions from './store/cl.actions';
import * as RTLActions from '../store/rtl.actions';
import * as fromRTLReducer from '../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-root-app',
  templateUrl: './cl-root.component.html',
  styleUrls: ['./cl-root.component.scss']
})
export class ClRootComponent implements OnInit, OnDestroy {
  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.State>, private actions$: Actions, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    console.warn('CL ROOT');
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
    this.actions$.pipe(takeUntil(this.unsubs[0]), filter((action) => action.type === RTLActions.INIT_APP_DATA))
    .subscribe((actionPayload: RTLActions.InitAppData) => {
      this.store.dispatch(new CLActions.FetchCLInfo());
    });
    this.actions$.pipe(takeUntil(this.unsubs[1]), filter((action) => action.type === CLActions.SET_CL_INFO))
    .subscribe((infoData: CLActions.SetCLInfo) => {
      if (undefined !== infoData.payload.identity_pubkey) {
        this.initializeRemainingData();
      }
    });
  }

  initializeRemainingData() {
    // this.store.dispatch(new CLActions.FetchPeers());
    // this.store.dispatch(new CLActions.FetchBalance('channels'));
    // this.store.dispatch(new CLActions.FetchFees());
    // this.store.dispatch(new CLActions.FetchNetwork());
    // this.store.dispatch(new CLActions.FetchChannels({routeParam: 'all'}));
    // this.store.dispatch(new CLActions.FetchChannels({routeParam: 'pending'}));
    // this.store.dispatch(new CLActions.FetchInvoices({num_max_invoices: 25, reversed: true}));
    // this.store.dispatch(new CLActions.FetchPayments());
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}

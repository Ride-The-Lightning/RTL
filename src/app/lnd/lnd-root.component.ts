import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import * as RTLActions from '../store/rtl.actions';
import * as fromRTLReducer from '../store/rtl.reducers';

@Component({
  selector: 'rtl-lnd-root',
  templateUrl: './lnd-root.component.html',
  styleUrls: ['./lnd-root.component.scss']
})
export class LNDRootComponent implements OnInit, OnDestroy {
  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private actions$: Actions, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchLndInfo());
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
    this.actions$.pipe(takeUntil(this.unsubs[0]), filter((action) => action.type === RTLActions.SET_LND_INFO || action.type === RTLActions.INIT_APP_DATA))
    .subscribe((infoData: RTLActions.SetLndInfo | RTLActions.InitAppData) => {
      if(infoData.type === RTLActions.SET_LND_INFO && undefined !== infoData.payload.identity_pubkey) {
        this.initializeRemainingData();
      }
      if(infoData.type === RTLActions.INIT_APP_DATA) {
        this.store.dispatch(new RTLActions.FetchLndInfo());
      }
    });
  }

  initializeRemainingData() {
    this.store.dispatch(new RTLActions.FetchFees());
    this.store.dispatch(new RTLActions.FetchPeers());
    this.store.dispatch(new RTLActions.FetchBalance('channels'));
    this.store.dispatch(new RTLActions.FetchNetwork());
    this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'all'}));
    this.store.dispatch(new RTLActions.FetchChannels({routeParam: 'pending'}));
    this.store.dispatch(new RTLActions.FetchInvoices({num_max_invoices: 25, reversed: true}));
    this.store.dispatch(new RTLActions.FetchPayments());
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}

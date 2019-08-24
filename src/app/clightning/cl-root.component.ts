import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import * as RTLActions from '../shared/store/rtl.actions';
import * as fromRTLReducer from '../shared/store/rtl.reducers';

@Component({
  selector: 'rtl-cl-root',
  templateUrl: './cl-root.component.html',
  styleUrls: ['./cl-root.component.scss']
})
export class CLRootComponent implements OnInit, OnDestroy {
  
  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.State>, private actions$: Actions, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    console.warn('CL ROOT')
    this.store.dispatch(new RTLActions.FetchInfo());
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
    this.actions$.pipe(takeUntil(this.unsubs[0]), filter((action) => action.type === RTLActions.SET_INFO || action.type === RTLActions.INIT_APP_DATA))
    .subscribe((infoData: RTLActions.SetInfo | RTLActions.InitAppData) => {
      if(infoData.type === RTLActions.SET_INFO && undefined !== infoData.payload.identity_pubkey) {
        this.initializeRemainingData();
      }
      if(infoData.type === RTLActions.INIT_APP_DATA) {
        this.store.dispatch(new RTLActions.FetchInfo());
      }
    });
  }

  initializeRemainingData() {
    this.store.dispatch(new RTLActions.FetchPeers());
    this.store.dispatch(new RTLActions.FetchBalance('channels'));
    this.store.dispatch(new RTLActions.FetchFees());
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

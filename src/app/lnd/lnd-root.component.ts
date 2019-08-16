import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import * as fromLNDReducer from './store/lnd.reducers';
import * as LNDActions from './store/lnd.actions';
import * as fromRTLReducer from '../store/rtl.reducers';

@Component({
  selector: 'rtl-lnd-root-app',
  templateUrl: './lnd-root.component.html',
  styleUrls: ['./lnd-root.component.scss']
})
export class LndRootComponent implements OnInit, OnDestroy {
  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.State>, private lndStore: Store<fromLNDReducer.LNDState>, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    console.warn('LND ROOT');
    this.store.dispatch(new LNDActions.FetchInfo());
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
    this.lndStore.select('lnd')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe(lndStore => {
      if (undefined !== lndStore.information.identity_pubkey) {
        this.initializeRemainingData();
      }
    });    
  }

  initializeRemainingData() {
    this.store.dispatch(new LNDActions.FetchPeers());
    this.store.dispatch(new LNDActions.FetchBalance('channels'));
    this.store.dispatch(new LNDActions.FetchFees());
    this.store.dispatch(new LNDActions.FetchNetwork());
    this.store.dispatch(new LNDActions.FetchChannels({routeParam: 'all'}));
    this.store.dispatch(new LNDActions.FetchChannels({routeParam: 'pending'}));
    this.store.dispatch(new LNDActions.FetchInvoices({num_max_invoices: 25, reversed: true}));
    this.store.dispatch(new LNDActions.FetchPayments());
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}

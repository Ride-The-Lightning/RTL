import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import * as LNDActions from './store/lnd.actions';
import * as fromApp from '../store/rtl.reducers';

@Component({
  selector: 'rtl-lnd-root-app',
  templateUrl: './lnd-root.component.html',
  styleUrls: ['./lnd-root.component.scss']
})
export class LndRootComponent implements OnInit, OnDestroy {
  unsubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromApp.AppState>, private router: Router, private activatedRoute: ActivatedRoute, private actions$: Actions) {}

  ngOnInit() {
    console.warn('LND ROOT');
    // this.store.dispatch(new LNDActions.FetchInfo());
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
    this.store.select('lnd')
    .pipe(takeUntil(this.unsubs[0]))
    .subscribe(lndStore => {
      console.warn(lndStore);
      if (undefined !== lndStore.information.identity_pubkey) {
        this.initializeRemainingData();
      }
    });    
    this.actions$.pipe(takeUntil(this.unsubs[2]), filter((action) => action.type === LNDActions.SET_INFO))
    .subscribe((infoData: LNDActions.SetInfo) => {
      console.warn(infoData);
      if (undefined !== infoData.payload.identity_pubkey) {
        this.initializeRemainingData();
      }
    });
    // this.actions$
    // .pipe(
    //   takeUntil(this.unSubs[3]),
    //   filter(action => action.type === RTLActions.INIT_APP_DATA || action.type === LNDActions.SET_INFO || action.type === CLActions.SET_CL_INFO)
    // ).subscribe((actionPayload: RTLActions.InitAppData | LNDActions.SetInfo | CLActions.SetCLInfo) => {
    //   // if (actionPayload.type === RTLActions.INIT_APP_DATA) {
    //     if(this.information.identity_pubkey) {
    //       this.initializeRemainingData();
    //     }
    // });    

  }

  initializeRemainingData() {
    console.warn('SOMETHING IS WRONG HERE');
    // this.store.dispatch(new LNDActions.FetchPeers());
    // this.store.dispatch(new LNDActions.FetchBalance('channels'));
    // this.store.dispatch(new LNDActions.FetchFees());
    // this.store.dispatch(new LNDActions.FetchNetwork());
    // this.store.dispatch(new LNDActions.FetchChannels({routeParam: 'all'}));
    // this.store.dispatch(new LNDActions.FetchChannels({routeParam: 'pending'}));
    // this.store.dispatch(new LNDActions.FetchInvoices({num_max_invoices: 25, reversed: true}));
    // this.store.dispatch(new LNDActions.FetchPayments());
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}

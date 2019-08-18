import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import * as CLActions from './store/cl.actions';
import * as RTLActions from '../store/rtl.actions';
import * as fromApp from '../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-root-app',
  templateUrl: './cl-root.component.html',
  styleUrls: ['./cl-root.component.scss']
})
export class ClRootComponent implements OnInit, OnDestroy {
  unsubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromApp.AppState>, private actions$: Actions, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    console.warn('CL ROOT');
    // this.store.dispatch(new CLActions.FetchCLInfo());
    this.router.navigate(['./home'], {relativeTo: this.activatedRoute});
    // this.store.select('cl')
    // .pipe(takeUntil(this.unsubs[0]))
    // .subscribe(clStore => {
    //   console.warn(clStore);
    //   if (undefined !== clStore.information.identity_pubkey) {
    //     this.initializeRemainingData();
    //   }
    // });
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
    // this.store.dispatch(new CLActions.FetchCLFees());

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

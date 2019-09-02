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
    .subscribe((infoData: RTLActions.SetCLInfo | RTLActions.InitAppData) => {
      if(infoData.type === RTLActions.SET_CL_INFO && undefined !== infoData.payload.id) {
        this.initializeRemainingData();
      }
    });
  }

  initializeRemainingData() {
    this.store.dispatch(new RTLActions.FetchCLFees());
    this.store.dispatch(new RTLActions.FetchCLBalance());
    this.store.dispatch(new RTLActions.FetchCLLocalRemoteBalance());
  }

  ngOnDestroy() {
    this.unsubs.forEach(unsub => {
      unsub.next();
      unsub.complete();
    });
  }
}

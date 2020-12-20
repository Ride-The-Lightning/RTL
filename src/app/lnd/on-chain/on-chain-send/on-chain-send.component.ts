import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { OnChainSendModalComponent } from '../on-chain-send-modal/on-chain-send-modal.component';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-on-chain-send',
  templateUrl: './on-chain-send.component.html',
  styleUrls: ['./on-chain-send.component.scss']
})
export class OnChainSendComponent implements OnInit, OnDestroy {
  public sweepAll = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.data.pipe(takeUntil(this.unSubs[0])).subscribe(routeData => this.sweepAll = routeData.sweepAll);
  }

  openSendFundsModal() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      sweepAll: this.sweepAll,
      component: OnChainSendModalComponent
    }}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

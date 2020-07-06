import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { ECLOnChainSendComponent } from './on-chain-send-modal/on-chain-send.component';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-on-chain',
  templateUrl: './on-chain.component.html',
  styleUrls: ['./on-chain.component.scss']
})
export class ECLOnChainComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public faExchangeAlt = faExchangeAlt;
  public faChartPie = faChartPie;
  public balances = [{title: 'Total Balance', dataValue: 0}, {title: 'Confirmed', dataValue: 0}, {title: 'Unconfirmed', dataValue: 0}];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.balances = [{title: 'Total Balance', dataValue: rtlStore.onchainBalance.total || 0}, {title: 'Confirmed', dataValue: rtlStore.onchainBalance.confirmed}, {title: 'Unconfirmed', dataValue: rtlStore.onchainBalance.unconfirmed}];
    });
  }

  openSendFundsModal() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      component: ECLOnChainSendComponent
    }}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

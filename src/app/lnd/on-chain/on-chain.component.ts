import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import * as fromRTLReducer from '../../store/rtl.reducers';
import * as RTLActions from '../../store/rtl.actions';
import { OnChainSendComponent } from './on-chain-send-modal/on-chain-send.component';

@Component({
  selector: 'rtl-on-chain',
  templateUrl: './on-chain.component.html',
  styleUrls: ['./on-chain.component.scss']
})
export class OnChainComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public faExchangeAlt = faExchangeAlt;
  public faChartPie = faChartPie;
  public balances = [{title: 'Total Balance', dataValue: 0}, {title: 'Confirmed', dataValue: 0}, {title: 'Unconfirmed', dataValue: 0}];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.balances = [{title: 'Total Balance', dataValue: rtlStore.blockchainBalance.total_balance || 0}, {title: 'Confirmed', dataValue: rtlStore.blockchainBalance.confirmed_balance}, {title: 'Unconfirmed', dataValue: rtlStore.blockchainBalance.unconfirmed_balance}];
    });
  }

  openSendFundsModal(sweepAll: boolean) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      sweepAll: sweepAll,
      component: OnChainSendComponent
    }}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {
  faExchangeAlt = faExchangeAlt;
  faChartPie = faChartPie;
  balances = [{title: 'Local Capacity', dataValue: 0, tooltip: 'Amount you can send'}, {title: 'Remote Capacity', dataValue: 0, tooltip: 'Amount you can receive'}];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.balances = [{title: 'Local Capacity', dataValue: rtlStore.totalLocalBalance, tooltip: 'Amount you can send'}, {title: 'Remote Capacity', dataValue: rtlStore.totalRemoteBalance, tooltip: 'Amount you can receive'}];
      this.logger.info(rtlStore);
    });
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';
import * as fromRTLReducer from '../../store/rtl.reducers';
import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';

@Component({
  selector: 'rtl-ecl-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class ECLTransactionsComponent implements OnInit, OnDestroy {
  faExchangeAlt = faExchangeAlt;
  faChartPie = faChartPie;
  currencyUnits = [];
  balances = [{title: 'Local Capacity', dataValue: 0, tooltip: 'Amount you can send'}, {title: 'Remote Capacity', dataValue: 0, tooltip: 'Amount you can receive'}];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>) {}

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.currencyUnits = rtlStore.nodeSettings.currencyUnits;
      if(rtlStore.nodeSettings.userPersona === UserPersonaEnum.OPERATOR) {
        this.balances = [{title: 'Local Capacity', dataValue: rtlStore.lightningBalance.localBalance, tooltip: 'Amount you can send'}, {title: 'Remote Capacity', dataValue: rtlStore.lightningBalance.remoteBalance, tooltip: 'Amount you can receive'}];
      } else {
        this.balances = [{title: 'Outbound Capacity', dataValue: rtlStore.lightningBalance.localBalance, tooltip: 'Amount you can send'}, {title: 'Inbound Capacity', dataValue: rtlStore.lightningBalance.remoteBalance, tooltip: 'Amount you can receive'}];
      }
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

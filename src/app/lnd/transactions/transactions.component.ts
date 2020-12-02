import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
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
  currencyUnits = [];
  balances = [{title: 'Local Capacity', dataValue: 0, tooltip: 'Amount you can send'}, {title: 'Remote Capacity', dataValue: 0, tooltip: 'Amount you can receive'}];
  public links = [{link: 'payments', name: 'Payments'}, {link: 'invoices', name: 'Invoices'}, {link: 'queryroutes', name: 'Query Routes'}];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

  ngOnInit() {
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    });
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.currencyUnits = rtlStore.nodeSettings.currencyUnits;
      if(rtlStore.nodeSettings.userPersona === UserPersonaEnum.OPERATOR) {
        this.balances = [{title: 'Local Capacity', dataValue: rtlStore.totalLocalBalance, tooltip: 'Amount you can send'}, {title: 'Remote Capacity', dataValue: rtlStore.totalRemoteBalance, tooltip: 'Amount you can receive'}];
      } else {
        this.balances = [{title: 'Outbound Capacity', dataValue: rtlStore.totalLocalBalance, tooltip: 'Amount you can send'}, {title: 'Inbound Capacity', dataValue: rtlStore.totalRemoteBalance, tooltip: 'Amount you can receive'}];
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

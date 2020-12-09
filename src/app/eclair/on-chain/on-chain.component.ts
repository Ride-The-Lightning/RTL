import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { ECLOnChainSendModalComponent } from './on-chain-send-modal/on-chain-send-modal.component';
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
  public links = [{link: 'receive', name: 'Receive'}, {link: 'send', name: 'Send'}];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

  ngOnInit() {
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    });
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.balances = [{title: 'Total Balance', dataValue: rtlStore.onchainBalance.total || 0}, {title: 'Confirmed', dataValue: rtlStore.onchainBalance.confirmed}, {title: 'Unconfirmed', dataValue: rtlStore.onchainBalance.unconfirmed}];
    });
  }

  openSendFundsModal() {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      component: ECLOnChainSendModalComponent
    }}));
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

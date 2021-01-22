import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { CLOnChainSendModalComponent } from './on-chain-send-modal/on-chain-send-modal.component';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-on-chain',
  templateUrl: './on-chain.component.html',
  styleUrls: ['./on-chain.component.scss']
})
export class CLOnChainComponent implements OnInit, OnDestroy {
  public selNode: SelNodeChild = {};
  public faExchangeAlt = faExchangeAlt;
  public faChartPie = faChartPie;
  public balances = [{title: 'Total Balance', dataValue: 0}, {title: 'Confirmed', dataValue: 0}, {title: 'Unconfirmed', dataValue: 0}];
  public links = [{link: 'receive', name: 'Receive'}, {link: 'send', name: 'Send'}, {link: 'sweep', name: 'Sweep All'}];
  public activeLink = this.links[0].link;
  public tables = [{id: 0, name: 'utxos'}, {id: 1, name: 'dustUtxos'}];
  public selectedTable = this.tables[0];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private router: Router, private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    let linkFound = this.links.find(link => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.selectedTable = this.tables.find(table => table.name === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      let linkFound = this.links.find(link => value.urlAfterRedirects.includes(link.link));
      this.activeLink = linkFound ? linkFound.link : this.links[0].link;
      this.selectedTable = this.tables.find(table => table.name === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
    });
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.balances = [{title: 'Total Balance', dataValue: rtlStore.balance.totalBalance || 0}, {title: 'Confirmed', dataValue: rtlStore.balance.confBalance}, {title: 'Unconfirmed', dataValue: rtlStore.balance.unconfBalance}];
    });
  }

  openSendFundsModal(sweepAll: boolean) {
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      sweepAll: sweepAll,
      component: CLOnChainSendModalComponent
    }}));
  }

  onSelectedTableIndexChanged(event: number) {
    this.selectedTable = this.tables.find(table => table.id === event);
    this.router.navigate(['./', this.activeLink, this.selectedTable.name], {relativeTo: this.activatedRoute});
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

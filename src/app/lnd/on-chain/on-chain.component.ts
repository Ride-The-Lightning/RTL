import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, ActivatedRoute, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../shared/models/RTLconfig';
import { RTLState } from '../../store/rtl.state';
import { blockchainBalance, lndNodeSettings } from '../store/lnd.selector';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { BlockchainBalance } from '../../shared/models/lndModels';

@Component({
  selector: 'rtl-on-chain',
  templateUrl: './on-chain.component.html',
  styleUrls: ['./on-chain.component.scss']
})
export class OnChainComponent implements OnInit, OnDestroy {

  public selNode: SelNodeChild | null = {};
  public faExchangeAlt = faExchangeAlt;
  public faChartPie = faChartPie;
  public balances = [{ title: 'Total Balance', dataValue: 0 }, { title: 'Confirmed', dataValue: 0 }, { title: 'Unconfirmed', dataValue: 0 }];
  public links = [{ link: 'receive', name: 'Receive' }, { link: 'send', name: 'Send' }, { link: 'sweep', name: 'Sweep All' }];
  public activeLink = this.links[0].link;
  public tables = [{ id: 0, name: 'utxos' }, { id: 1, name: 'trans' }, { id: 2, name: 'dustUtxos' }];
  public selectedTable = this.tables[0];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.selectedTable = this.tables.find((table) => table.name === this.router.url.substring(this.router.url.lastIndexOf('/') + 1)) || this.tables[0];
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          const linkFound = this.links.find((link) => (<ResolveEnd>value).urlAfterRedirects.includes(link.link));
          this.activeLink = linkFound ? linkFound.link : this.links[0].link;
          this.selectedTable = this.tables.find((table) => table.name === (<ResolveEnd>value).urlAfterRedirects.substring((<ResolveEnd>value).urlAfterRedirects.lastIndexOf('/') + 1)) || this.tables[0];
        }
      });
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeSettings: SelNodeChild | null) => {
        this.selNode = nodeSettings;
      });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[2])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.balances = [{ title: 'Total Balance', dataValue: bcBalanceSelector.blockchainBalance.total_balance || 0 }, { title: 'Confirmed', dataValue: (bcBalanceSelector.blockchainBalance.confirmed_balance || 0) }, { title: 'Unconfirmed', dataValue: (bcBalanceSelector.blockchainBalance.unconfirmed_balance || 0) }];
      });
  }

  onSelectedTableIndexChanged(event: number) {
    this.selectedTable = this.tables.find((table) => table.id === event) || this.tables[0];
    this.router.navigate(['./', this.activeLink, this.selectedTable.name], { relativeTo: this.activatedRoute });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { LoggerService } from '../../shared/services/logger.service';

import { RTLState } from '../../store/rtl.state';
import { rootSelectedNode } from '../../store/rtl.selector';
import { utxoBalances } from '../store/cln.selector';
import { Balance, LocalRemoteBalance, UTXO } from '../../shared/models/clnModels';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { Node } from '../../shared/models/RTLconfig';
import { fetchOffers, fetchOfferBookmarks } from '../store/cln.actions';

@Component({
  selector: 'rtl-cln-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class CLNTransactionsComponent implements OnInit, OnDestroy {

  faExchangeAlt = faExchangeAlt;
  faChartPie = faChartPie;
  currencyUnits: string[] = [];
  routerUrl = '';
  balances = [{ title: 'Local Capacity', dataValue: 0, tooltip: 'Amount you can send' }, { title: 'Remote Capacity', dataValue: 0, tooltip: 'Amount you can receive' }];
  public selNode: Node | null;
  public links = [{ link: 'payments', name: 'Payments' }, { link: 'invoices', name: 'Invoices' }];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private router: Router) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          const linkFound = this.links.find((link) => (<ResolveEnd>value).urlAfterRedirects.includes(link.link));
          this.activeLink = linkFound ? linkFound.link : this.links[0].link;
          this.routerUrl = (<ResolveEnd>value).urlAfterRedirects;
        }
      });
    this.store.select(rootSelectedNode).pipe(takeUntil(this.unSubs[1])).subscribe((nodeSettings: Node | null) => {
      this.selNode = nodeSettings;
      if (this.selNode && this.selNode.settings.enableOffers) {
        this.store.dispatch(fetchOffers());
        this.store.dispatch(fetchOfferBookmarks());
        this.links.push({ link: 'offers', name: 'Offers' });
        this.links.push({ link: 'offrBookmarks', name: 'Paid Offer Bookmarks' });
        const linkFound = this.links.find((link) => this.router.url.includes(link.link));
        this.activeLink = linkFound ? linkFound.link : this.links[0].link;
      }
    });
    this.store.select(utxoBalances).pipe(takeUntil(this.unSubs[2]),
      withLatestFrom(this.store.select(rootSelectedNode))).
      subscribe(([utxoBalancesSeletor, nodeSettings]: [{ utxos: UTXO[], balance: Balance, localRemoteBalance: LocalRemoteBalance, apiCallStatus: ApiCallStatusPayload }, (Node | null)]) => {
        this.currencyUnits = nodeSettings?.settings.currencyUnits || [];
        if (nodeSettings && nodeSettings.settings.userPersona === UserPersonaEnum.OPERATOR) {
          this.balances = [{ title: 'Local Capacity', dataValue: utxoBalancesSeletor.localRemoteBalance.localBalance, tooltip: 'Amount you can send' }, { title: 'Remote Capacity', dataValue: utxoBalancesSeletor.localRemoteBalance.remoteBalance, tooltip: 'Amount you can receive' }];
        } else {
          this.balances = [{ title: 'Outbound Capacity', dataValue: utxoBalancesSeletor.localRemoteBalance.localBalance, tooltip: 'Amount you can send' }, { title: 'Inbound Capacity', dataValue: utxoBalancesSeletor.localRemoteBalance.remoteBalance, tooltip: 'Amount you can receive' }];
        }
        this.logger.info(utxoBalancesSeletor);
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

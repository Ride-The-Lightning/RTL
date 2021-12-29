import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { LoggerService } from '../../shared/services/logger.service';

import { RTLState } from '../../store/rtl.state';
import { clNodeSettings, localRemoteBalance } from '../store/cl.selector';
import { LocalRemoteBalance } from '../../shared/models/clModels';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { fetchOffers, fetchOfferBookmarks } from '../store/cl.actions';

@Component({
  selector: 'rtl-cl-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class CLTransactionsComponent implements OnInit, OnDestroy {

  faExchangeAlt = faExchangeAlt;
  faChartPie = faChartPie;
  currencyUnits = [];
  routerUrl = '';
  balances = [{ title: 'Local Capacity', dataValue: 0, tooltip: 'Amount you can send' }, { title: 'Remote Capacity', dataValue: 0, tooltip: 'Amount you can receive' }];
  public selNode: SelNodeChild = {};
  public links = [{ link: 'payments', name: 'Payments' }, { link: 'invoices', name: 'Invoices' }];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private router: Router) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe((value: any) => {
        const linkFound = this.links.find((link) => value.urlAfterRedirects.includes(link.link));
        this.activeLink = linkFound ? linkFound.link : this.links[0].link;
        this.routerUrl = value.urlAfterRedirects;
      });
    this.store.select(clNodeSettings).pipe(takeUntil(this.unSubs[1])).subscribe((nodeSettings: SelNodeChild) => {
      this.selNode = nodeSettings;
      if (this.selNode.enableOffers) {
        this.store.dispatch(fetchOffers());
        this.store.dispatch(fetchOfferBookmarks());
        this.links.push({ link: 'offers', name: 'Offers' });
        this.links.push({ link: 'offrBookmarks', name: 'Paid Offer Bookmarks' });
        const linkFound = this.links.find((link) => this.router.url.includes(link.link));
        this.activeLink = linkFound ? linkFound.link : this.links[0].link;
      }
    });
    this.store.select(localRemoteBalance).pipe(takeUntil(this.unSubs[2]),
      withLatestFrom(this.store.select(clNodeSettings))).
      subscribe(([lrBalSeletor, nodeSettings]: [{ localRemoteBalance: LocalRemoteBalance, apiCallStatus: ApiCallStatusPayload }, SelNodeChild]) => {
        this.currencyUnits = nodeSettings.currencyUnits;
        if (nodeSettings.userPersona === UserPersonaEnum.OPERATOR) {
          this.balances = [{ title: 'Local Capacity', dataValue: lrBalSeletor.localRemoteBalance.localBalance, tooltip: 'Amount you can send' }, { title: 'Remote Capacity', dataValue: lrBalSeletor.localRemoteBalance.remoteBalance, tooltip: 'Amount you can receive' }];
        } else {
          this.balances = [{ title: 'Outbound Capacity', dataValue: lrBalSeletor.localRemoteBalance.localBalance, tooltip: 'Amount you can send' }, { title: 'Inbound Capacity', dataValue: lrBalSeletor.localRemoteBalance.remoteBalance, tooltip: 'Amount you can receive' }];
        }
        this.logger.info(lrBalSeletor);
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

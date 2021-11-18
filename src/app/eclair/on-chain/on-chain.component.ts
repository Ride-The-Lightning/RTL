import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { ECLOnChainSendModalComponent } from './on-chain-send-modal/on-chain-send-modal.component';
import { SelNodeChild } from '../../shared/models/RTLconfig';
import { RTLState } from '../../store/rtl.state';
import { openAlert } from '../../store/rtl.actions';
import { eclNodeSettings, onchainBalance } from '../store/ecl.selector';
import { OnChainBalance } from '../../shared/models/eclModels';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-ecl-on-chain',
  templateUrl: './on-chain.component.html',
  styleUrls: ['./on-chain.component.scss']
})
export class ECLOnChainComponent implements OnInit, OnDestroy {

  public selNode: SelNodeChild = {};
  public faExchangeAlt = faExchangeAlt;
  public faChartPie = faChartPie;
  public balances = [{ title: 'Total Balance', dataValue: 0 }, { title: 'Confirmed', dataValue: 0 }, { title: 'Unconfirmed', dataValue: 0 }];
  public links = [{ link: 'receive', name: 'Receive' }, { link: 'send', name: 'Send' }];
  public activeLink = this.links[0].link;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router) { }

  ngOnInit() {
    const linkFound = this.links.find((link) => this.router.url.includes(link.link));
    this.activeLink = linkFound ? linkFound.link : this.links[0].link;
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe((value: any) => {
        const linkFound = this.links.find((link) => value.urlAfterRedirects.includes(link.link));
        this.activeLink = linkFound ? linkFound.link : this.links[0].link;
      });
    this.store.select(eclNodeSettings).pipe(takeUntil(this.unSubs[1])).
      subscribe((nodeSettings) => {
        this.selNode = nodeSettings;
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[2])).
      subscribe((oCBalanceSelector: OnChainBalance | ApiCallStatusPayload) => {
        if (oCBalanceSelector.hasOwnProperty('total')) {
          this.balances = [{ title: 'Total Balance', dataValue: (<OnChainBalance>oCBalanceSelector).total || 0 }, { title: 'Confirmed', dataValue: (<OnChainBalance>oCBalanceSelector).confirmed }, { title: 'Unconfirmed', dataValue: (<OnChainBalance>oCBalanceSelector).unconfirmed }];
        }
      });
  }

  openSendFundsModal() {
    this.store.dispatch(openAlert({
      payload: {
        data: {
          component: ECLOnChainSendModalComponent
        }
      }
    }));
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

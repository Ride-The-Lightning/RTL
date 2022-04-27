import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, withLatestFrom } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faExchangeAlt, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { UserPersonaEnum } from '../../shared/services/consts-enums-functions';
import { LoggerService } from '../../shared/services/logger.service';
import { RTLState } from '../../store/rtl.state';
import { channels, lndNodeSettings } from '../store/lnd.selector';
import { Channel, ChannelsSummary, LightningBalance } from '../../shared/models/lndModels';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { SelNodeChild } from '../../shared/models/RTLconfig';

@Component({
  selector: 'rtl-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit, OnDestroy {

  faExchangeAlt = faExchangeAlt;
  faChartPie = faChartPie;
  currencyUnits = [];
  balances = [{ title: 'Local Capacity', dataValue: 0, tooltip: 'Amount you can send' }, { title: 'Remote Capacity', dataValue: 0, tooltip: 'Amount you can receive' }];
  public links = [{ link: 'payments', name: 'Payments' }, { link: 'invoices', name: 'Invoices' }, { link: 'lookuptransactions', name: 'Lookup' }];
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
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1]),
      withLatestFrom(this.store.select(lndNodeSettings))).
      subscribe(([channelsSelector, nodeSettings]: [{ channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }, SelNodeChild]) => {
        this.currencyUnits = nodeSettings.currencyUnits;
        if (nodeSettings.userPersona === UserPersonaEnum.OPERATOR) {
          this.balances = [{ title: 'Local Capacity', dataValue: channelsSelector.lightningBalance.local, tooltip: 'Amount you can send' }, { title: 'Remote Capacity', dataValue: channelsSelector.lightningBalance.remote, tooltip: 'Amount you can receive' }];
        } else {
          this.balances = [{ title: 'Outbound Capacity', dataValue: channelsSelector.lightningBalance.local, tooltip: 'Amount you can send' }, { title: 'Inbound Capacity', dataValue: channelsSelector.lightningBalance.remote, tooltip: 'Amount you can receive' }];
        }
        this.logger.info(channelsSelector);
      });
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

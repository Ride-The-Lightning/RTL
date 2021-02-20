import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUsers, faChartPie } from '@fortawesome/free-solid-svg-icons';

import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ECLConnectionsComponent implements OnInit, OnDestroy {
  public activePeers = 0;
  public activeChannels = 0;
  public faUsers = faUsers;
  public faChartPie = faChartPie;
  public balances = [{title: 'Total Balance', dataValue: 0}, {title: 'Confirmed', dataValue: 0}, {title: 'Unconfirmed', dataValue: 0}];
  public links = [{link: 'channels', name: 'Channels'}, {link: 'peers', name: 'Peers'}];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

  ngOnInit() {
    this.activeLink = this.links.findIndex(link => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.activeLink = this.links.findIndex(link => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
    });
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.activePeers = (rtlStore.peers && rtlStore.peers.length) ? rtlStore.peers.length : 0;
      this.activeChannels = rtlStore.channelsStatus && rtlStore.channelsStatus.active && rtlStore.channelsStatus.active.channels ? rtlStore.channelsStatus.active.channels : 0;
      this.balances = [{title: 'Total Balance', dataValue: rtlStore.onchainBalance.total || 0}, {title: 'Confirmed', dataValue: rtlStore.onchainBalance.confirmed}, {title: 'Unconfirmed', dataValue: rtlStore.onchainBalance.unconfirmed}];
    });
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/ecl/connections/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

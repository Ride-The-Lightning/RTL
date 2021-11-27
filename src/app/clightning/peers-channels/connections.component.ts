import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUsers, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../shared/services/logger.service';

import { RTLState } from '../../store/rtl.state';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { balance, channels, clNodeInformation, peers } from '../store/cl.selector';
import { Balance, Channel, GetInfo, Peer } from '../../shared/models/clModels';

@Component({
  selector: 'rtl-cl-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class CLConnectionsComponent implements OnInit, OnDestroy {

  public activePeers = 0;
  public activeChannels = 0;
  public faUsers = faUsers;
  public faChartPie = faChartPie;
  public balances = [{ title: 'Total Balance', dataValue: 0 }, { title: 'Confirmed', dataValue: 0 }, { title: 'Unconfirmed', dataValue: 0 }];
  public links = [{ link: 'channels', name: 'Channels' }, { link: 'peers', name: 'Peers' }];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private logger: LoggerService, private router: Router) { }

  ngOnInit() {
    this.activeLink = this.links.findIndex((link) => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe((value: any) => {
        this.activeLink = this.links.findIndex((link) => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[1])).
      subscribe((channelsSeletor: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.activeChannels = channelsSeletor.activeChannels.length || 0;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[2])).
      subscribe((peersSeletor: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.activePeers = (peersSeletor.peers && peersSeletor.peers.length) ? peersSeletor.peers.length : 0;
        this.logger.info(peersSeletor);
      });
    this.store.select(balance).pipe(takeUntil(this.unSubs[3])).
      subscribe((balanceSeletor: { balance: Balance, apiCallStatus: ApiCallStatusPayload }) => {
        this.balances = [{ title: 'Total Balance', dataValue: balanceSeletor.balance.totalBalance || 0 }, { title: 'Confirmed', dataValue: balanceSeletor.balance.confBalance }, { title: 'Unconfirmed', dataValue: balanceSeletor.balance.unconfBalance }];
      });
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/cl/connections/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

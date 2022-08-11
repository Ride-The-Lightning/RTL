import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUsers, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { RTLState } from '../../store/rtl.state';
import { allChannelsInfo, onchainBalance, peers } from '../store/ecl.selector';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { Channel, ChannelsStatus, LightningBalance, OnChainBalance, Peer } from '../../shared/models/eclModels';

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
  public balances = [{ title: 'Total Balance', dataValue: 0 }, { title: 'Confirmed', dataValue: 0 }, { title: 'Unconfirmed', dataValue: 0 }];
  public links = [{ link: 'channels', name: 'Channels' }, { link: 'peers', name: 'Peers' }];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private router: Router) { }

  ngOnInit() {
    this.activeLink = this.links.findIndex((link) => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          this.activeLink = this.links.findIndex((link) => link.link === (<ResolveEnd>value).urlAfterRedirects.substring((<ResolveEnd>value).urlAfterRedirects.lastIndexOf('/') + 1));
        }
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[1])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.activePeers = (peersSelector.peers && peersSelector.peers.length) ? peersSelector.peers.length : 0;
      });
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[2])).
      subscribe((allChannelsSelector: ({ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload })) => {
        this.activeChannels = allChannelsSelector.channelsStatus && allChannelsSelector.channelsStatus.active && allChannelsSelector.channelsStatus.active.channels ? allChannelsSelector.channelsStatus.active.channels : 0;
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[3])).
      subscribe((oCBalanceSelector: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.balances = [{ title: 'Total Balance', dataValue: oCBalanceSelector.onchainBalance.total || 0 }, { title: 'Confirmed', dataValue: oCBalanceSelector.onchainBalance.confirmed }, { title: 'Unconfirmed', dataValue: oCBalanceSelector.onchainBalance.unconfirmed }];
      });
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/ecl/connections/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

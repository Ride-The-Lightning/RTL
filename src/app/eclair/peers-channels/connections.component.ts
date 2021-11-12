import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
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
      subscribe((value: any) => {
        this.activeLink = this.links.findIndex((link) => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
      });
    this.store.select(peers).
      pipe(takeUntil(this.unSubs[1])).
      subscribe((selectedPeers: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.activePeers = (selectedPeers.peers && selectedPeers.peers.length) ? selectedPeers.peers.length : 0;
      });
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[2])).
      subscribe((selAllChannels: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload }) => {
        this.activeChannels = selAllChannels.channelsStatus && selAllChannels.channelsStatus.active && selAllChannels.channelsStatus.active.channels ? selAllChannels.channelsStatus.active.channels : 0;
      });
    this.store.select(onchainBalance).
      pipe(takeUntil(this.unSubs[3])).
      subscribe((selectedOCBal: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.balances = [{ title: 'Total Balance', dataValue: selectedOCBal.onchainBalance.total || 0 }, { title: 'Confirmed', dataValue: selectedOCBal.onchainBalance.confirmed }, { title: 'Unconfirmed', dataValue: selectedOCBal.onchainBalance.unconfirmed }];
      });
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/ecl/connections/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faUsers, faChartPie } from '@fortawesome/free-solid-svg-icons';

import { Node } from '../../shared/models/RTLconfig';
import { LoggerService } from '../../shared/services/logger.service';

import { RTLState } from '../../store/rtl.state';
import { blockchainBalance, channels, lndNodeSettings, peers } from '../store/lnd.selector';
import { ApiCallStatusPayload } from '../../shared/models/apiCallsPayload';
import { BlockchainBalance, Channel, ChannelsSummary, LightningBalance, Peer } from '../../shared/models/lndModels';

@Component({
  selector: 'rtl-connections',
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss']
})
export class ConnectionsComponent implements OnInit, OnDestroy {

  public selNode: Node | null;
  public activePeers = 0;
  public activeChannels = 0;
  public faUsers = faUsers;
  public faChartPie = faChartPie;
  public balances = [{ title: 'Total Balance', dataValue: 0 }, { title: 'Confirmed', dataValue: 0 }, { title: 'Unconfirmed', dataValue: 0 }];
  public links = [{ link: 'channels', name: 'Channels' }, { link: 'peers', name: 'Peers' }];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private store: Store<RTLState>, private logger: LoggerService, private router: Router) { }

  ngOnInit() {
    this.activeLink = this.links.findIndex((link) => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          this.activeLink = this.links.findIndex((link) => link.link === (<ResolveEnd>value).urlAfterRedirects.substring((<ResolveEnd>value).urlAfterRedirects.lastIndexOf('/') + 1));
        }
      });
    this.store.select(lndNodeSettings).pipe(takeUntil(this.unSubs[1])).subscribe((nodeSettings: Node | null) => { this.selNode = nodeSettings; });
    this.store.select(peers).pipe(takeUntil(this.unSubs[2])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.activePeers = (peersSelector.peers && peersSelector.peers.length) ? peersSelector.peers.length : 0;
        this.logger.info(peersSelector);
      });
    this.store.select(channels).pipe(takeUntil(this.unSubs[3])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.activeChannels = channelsSelector.channelsSummary.active?.num_channels || 0;
        this.logger.info(channelsSelector);
      });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[4])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.balances = [{ title: 'Total Balance', dataValue: bcBalanceSelector.blockchainBalance.total_balance || 0 }, { title: 'Confirmed', dataValue: (bcBalanceSelector.blockchainBalance.confirmed_balance || 0) }, { title: 'Unconfirmed', dataValue: (bcBalanceSelector.blockchainBalance.unconfirmed_balance || 0) }];
        this.logger.info(bcBalanceSelector);
      });
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/lnd/connections/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

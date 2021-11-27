import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { OpenChannelComponent } from '../open-channel-modal/open-channel.component';
import { Peer, GetInfo, Channel, ChannelsSummary, LightningBalance, PendingChannelsSummary, PendingChannels, ClosedChannel, BlockchainBalance } from '../../../../shared/models/lndModels';
import { LoggerService } from '../../../../shared/services/logger.service';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { blockchainBalance, channels, closedChannels, lndNodeInformation, peers, pendingChannels } from '../../../store/lnd.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-channels-tables',
  templateUrl: './channels-tables.component.html',
  styleUrls: ['./channels-tables.component.scss']
})
export class ChannelsTablesComponent implements OnInit, OnDestroy {

  public numOpenChannels = 0;
  public numPendingChannels = 0;
  public numClosedChannels = 0;
  public numActiveHTLCs = 0;
  public peers: Peer[] = [];
  public information: GetInfo = {};
  public totalBalance = 0;
  public links = [{ link: 'open', name: 'Open' }, { link: 'pending', name: 'Pending' }, { link: 'closed', name: 'Closed' }, { link: 'activehtlcs', name: 'Active HTLCs' }];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private router: Router) { }

  ngOnInit() {
    this.activeLink = this.links.findIndex((link) => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe((value: any) => {
        this.activeLink = this.links.findIndex((link) => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
      });
    this.store.select(lndNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => { this.information = nodeInfo; });
    this.store.select(channels).pipe(takeUntil(this.unSubs[2])).
      subscribe((channelsSelector: { channels: Channel[], channelsSummary: ChannelsSummary, lightningBalance: LightningBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.numOpenChannels = (channelsSelector.channels && channelsSelector.channels.length) ? channelsSelector.channels.length : 0;
        this.numActiveHTLCs = channelsSelector.channels.reduce((totalHTLCs, channel) => totalHTLCs + (channel.pending_htlcs && channel.pending_htlcs.length > 0 ? channel.pending_htlcs.length : 0), 0);
        this.logger.info(channelsSelector);
      });
    this.store.select(pendingChannels).pipe(takeUntil(this.unSubs[3])).
      subscribe((pendingChannelsSelector: { pendingChannels: PendingChannels, pendingChannelsSummary: PendingChannelsSummary, apiCallStatus: ApiCallStatusPayload }) => {
        this.numPendingChannels = (pendingChannelsSelector.pendingChannelsSummary.total_channels) ? pendingChannelsSelector.pendingChannelsSummary.total_channels : 0;
      });
    this.store.select(closedChannels).pipe(takeUntil(this.unSubs[4])).
      subscribe((closedChannelsSelector: { closedChannels: ClosedChannel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.numClosedChannels = (closedChannelsSelector.closedChannels && closedChannelsSelector.closedChannels.length) ? closedChannelsSelector.closedChannels.length : 0;
      });
    this.store.select(blockchainBalance).pipe(takeUntil(this.unSubs[5])).
      subscribe((bcBalanceSelector: { blockchainBalance: BlockchainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.totalBalance = +bcBalanceSelector.blockchainBalance.total_balance;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[6])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.peers = peersSelector.peers;
        this.peers.forEach((peer) => {
          if (!peer.alias || peer.alias === '') {
            peer.alias = peer.pub_key.substring(0, 15) + '...';
          }
        });
        this.logger.info(peersSelector);
      });
  }

  onOpenChannel() {
    const peerToAddChannelMessage = {
      peers: this.peers,
      information: this.information,
      balance: this.totalBalance
    };
    this.store.dispatch(openAlert({
      payload: {
        data: {
          alertTitle: 'Open Channel',
          message: peerToAddChannelMessage,
          component: OpenChannelComponent
        }
      }
    }));
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/lnd/connections/channels/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

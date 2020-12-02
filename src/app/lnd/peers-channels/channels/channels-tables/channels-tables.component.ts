import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { OpenChannelComponent } from '../open-channel-modal/open-channel.component';
import { Peer, GetInfo } from '../../../../shared/models/lndModels';
import { LoggerService } from '../../../../shared/services/logger.service';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

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
  public links = [{link: 'open', name: 'Open'}, {link: 'pending', name: 'Pending'}, {link: 'closed', name: 'Closed'}, {link: 'activehtlcs', name: 'Active HTLCs'}];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

  ngOnInit() {
    this.activeLink = this.links.findIndex(link => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.activeLink = this.links.findIndex(link => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
    });
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.numOpenChannels = (rtlStore.allChannels && rtlStore.allChannels.length) ? rtlStore.allChannels.length : 0;
      this.numPendingChannels = (rtlStore.numberOfPendingChannels.total_channels) ? rtlStore.numberOfPendingChannels.total_channels : 0;
      this.numClosedChannels = (rtlStore.closedChannels && rtlStore.closedChannels.length) ? rtlStore.closedChannels.length : 0;
      this.numActiveHTLCs = rtlStore.allChannels.reduce((totalHTLCs, channel) => {
        return totalHTLCs + (channel.pending_htlcs && channel.pending_htlcs.length > 0 ? channel.pending_htlcs.length : 0);
      }, 0);
      this.information = rtlStore.information;
      this.totalBalance = +rtlStore.blockchainBalance.total_balance;
      this.peers = rtlStore.peers;
      this.peers.forEach(peer => {
        if (!peer.alias || peer.alias === '') {
          peer.alias = peer.pub_key.substring(0, 15) + '...';
        }
      });
      this.logger.info(rtlStore);
    });
  }

  onOpenChannel() {
    const peerToAddChannelMessage = {
      peers: this.peers, 
      information: this.information,
      balance: this.totalBalance
    };
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      alertTitle: 'Open Channel',
      message: peerToAddChannelMessage,
      component: OpenChannelComponent
    }}));
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/lnd/connections/channels/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

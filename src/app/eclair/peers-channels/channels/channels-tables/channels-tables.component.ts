import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd, Event } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ECLOpenChannelComponent } from '../open-channel-modal/open-channel.component';
import { LoggerService } from '../../../../shared/services/logger.service';
import { Channel, ChannelsStatus, GetInfo, LightningBalance, OnChainBalance, Peer } from '../../../../shared/models/eclModels';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';

import { RTLState } from '../../../../store/rtl.state';
import { openAlert } from '../../../../store/rtl.actions';
import { allChannelsInfo, eclNodeInformation, eclNodeSettings, onchainBalance, peers } from '../../../store/ecl.selector';
import { ApiCallStatusPayload } from '../../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-ecl-channels-tables',
  templateUrl: './channels-tables.component.html',
  styleUrls: ['./channels-tables.component.scss']
})
export class ECLChannelsTablesComponent implements OnInit, OnDestroy {

  public numOfOpenChannels = 0;
  public numOfPendingChannels = 0;
  public numOfInactiveChannels = 0;
  public selNode: SelNodeChild | null = {};
  public information: GetInfo = {};
  public peers: Peer[] = [];
  public totalBalance = 0;
  public links = [{ link: 'open', name: 'Open' }, { link: 'pending', name: 'Pending' }, { link: 'inactive', name: 'Inactive' }];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<RTLState>, private router: Router) { }

  ngOnInit() {
    this.activeLink = this.links.findIndex((link) => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter((e) => e instanceof ResolveEnd)).
      subscribe({
        next: (value: ResolveEnd | Event) => {
          this.activeLink = this.links.findIndex((link) => link.link === (<ResolveEnd>value).urlAfterRedirects.substring((<ResolveEnd>value).urlAfterRedirects.lastIndexOf('/') + 1));
        }
      });
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[1])).
      subscribe((allChannelsSelector: ({ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload })) => {
        this.numOfOpenChannels = (allChannelsSelector.channelsStatus && allChannelsSelector.channelsStatus.active && allChannelsSelector.channelsStatus.active.channels) ? allChannelsSelector.channelsStatus.active.channels : 0;
        this.numOfPendingChannels = (allChannelsSelector.channelsStatus && allChannelsSelector.channelsStatus.pending && allChannelsSelector.channelsStatus.pending.channels) ? allChannelsSelector.channelsStatus.pending.channels : 0;
        this.numOfInactiveChannels = (allChannelsSelector.channelsStatus && allChannelsSelector.channelsStatus.inactive && allChannelsSelector.channelsStatus.inactive.channels) ? allChannelsSelector.channelsStatus.inactive.channels : 0;
        this.logger.info(allChannelsSelector);
      });
    this.store.select(eclNodeSettings).pipe(takeUntil(this.unSubs[2])).
      subscribe((nodeSettings: SelNodeChild | null) => {
        this.selNode = nodeSettings;
      });
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[3])).
      subscribe((nodeInfo: GetInfo) => {
        this.information = nodeInfo;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[4])).
      subscribe((peersSelector: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.peers = peersSelector.peers;
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[5])).
      subscribe((oCBalanceSelector: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.totalBalance = oCBalanceSelector.onchainBalance.total || 0;
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
          component: ECLOpenChannelComponent
        }
      }
    }));
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/ecl/connections/channels/' + this.links[event.index].link);
  }


  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
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
  public selNode: SelNodeChild = {};
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
      subscribe((value: any) => {
        this.activeLink = this.links.findIndex((link) => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
      });
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[1])).
      subscribe((selAllChannels: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload }) => {
        this.numOfOpenChannels = (selAllChannels.channelsStatus && selAllChannels.channelsStatus.active && selAllChannels.channelsStatus.active.channels) ? selAllChannels.channelsStatus.active.channels : 0;
        this.numOfPendingChannels = (selAllChannels.channelsStatus && selAllChannels.channelsStatus.pending && selAllChannels.channelsStatus.pending.channels) ? selAllChannels.channelsStatus.pending.channels : 0;
        this.numOfInactiveChannels = (selAllChannels.channelsStatus && selAllChannels.channelsStatus.inactive && selAllChannels.channelsStatus.inactive.channels) ? selAllChannels.channelsStatus.inactive.channels : 0;
        this.logger.info(selAllChannels);
      });
    this.store.select(eclNodeSettings).pipe(takeUntil(this.unSubs[2])).
      subscribe((nodeSettings: SelNodeChild) => {
        this.selNode = nodeSettings;
      });
    this.store.select(eclNodeInformation).pipe(takeUntil(this.unSubs[3])).
      subscribe((nodeInfo: GetInfo) => {
        this.information = nodeInfo;
      });
    this.store.select(peers).pipe(takeUntil(this.unSubs[4])).
      subscribe((selPeers: { peers: Peer[], apiCallStatus: ApiCallStatusPayload }) => {
        this.peers = selPeers.peers;
      });
    this.store.select(onchainBalance).pipe(takeUntil(this.unSubs[5])).
      subscribe((selOCBal: { onchainBalance: OnChainBalance, apiCallStatus: ApiCallStatusPayload }) => {
        this.totalBalance = selOCBal.onchainBalance.total;
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
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

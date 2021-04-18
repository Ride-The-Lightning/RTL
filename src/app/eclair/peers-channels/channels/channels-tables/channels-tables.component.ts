import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { ECLOpenChannelComponent } from '../open-channel-modal/open-channel.component';
import { LoggerService } from '../../../../shared/services/logger.service';
import { GetInfo, Peer } from '../../../../shared/models/eclModels';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

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
  public links = [{link: 'open', name: 'Open'}, {link: 'pending', name: 'Pending'}, {link: 'inactive', name: 'Inactive'}];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private router: Router) {}

  ngOnInit() {
    this.activeLink = this.links.findIndex(link => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.activeLink = this.links.findIndex(link => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
    });
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      this.numOfOpenChannels = (rtlStore.channelsStatus && rtlStore.channelsStatus.active && rtlStore.channelsStatus.active.channels) ? rtlStore.channelsStatus.active.channels : 0;
      this.numOfPendingChannels = (rtlStore.channelsStatus && rtlStore.channelsStatus.pending && rtlStore.channelsStatus.pending.channels) ? rtlStore.channelsStatus.pending.channels : 0;
      this.numOfInactiveChannels = (rtlStore.channelsStatus && rtlStore.channelsStatus.inactive && rtlStore.channelsStatus.inactive.channels) ? rtlStore.channelsStatus.inactive.channels : 0;
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;    
      this.peers = rtlStore.peers;
      this.totalBalance = rtlStore.onchainBalance.total;
      console.warn(this.numOfPendingChannels);
      console.warn(rtlStore.channelsStatus.pending);
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
      component: ECLOpenChannelComponent
    }}));
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/ecl/connections/channels/' + this.links[event.index].link);
  }


  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

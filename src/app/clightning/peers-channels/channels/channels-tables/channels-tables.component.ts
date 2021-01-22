import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ResolveEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { CLOpenChannelComponent } from '../open-channel-modal/open-channel.component';
import { CommonService } from '../../../../shared/services/common.service';
import { LoggerService } from '../../../../shared/services/logger.service';
import { GetInfo, Peer, UTXO } from '../../../../shared/models/clModels';
import { SelNodeChild } from '../../../../shared/models/RTLconfig';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-channels-tables',
  templateUrl: './channels-tables.component.html',
  styleUrls: ['./channels-tables.component.scss']
})
export class CLChannelsTablesComponent implements OnInit, OnDestroy {
  public openChannels = 0;
  public pendingChannels = 0;
  public selNode: SelNodeChild = {};
  public information: GetInfo = {};
  public peers: Peer[] = [];
  public utxos: UTXO[] = [];
  public totalBalance = 0;
  public links = [{link: 'open', name: 'Open'}, {link: 'pending', name: 'Pending/Inactive'}];
  public activeLink = 0;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private commonService: CommonService, private router: Router) {}

  ngOnInit() {
    this.activeLink = this.links.findIndex(link => link.link === this.router.url.substring(this.router.url.lastIndexOf('/') + 1));
    this.router.events.pipe(takeUntil(this.unSubs[0]), filter(e => e instanceof ResolveEnd))
    .subscribe((value: ResolveEnd) => {
      this.activeLink = this.links.findIndex(link => link.link === value.urlAfterRedirects.substring(value.urlAfterRedirects.lastIndexOf('/') + 1));
    });
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe((rtlStore) => {
      if (rtlStore.allChannels && rtlStore.allChannels.length) {
        this.openChannels = 0;
        this.pendingChannels = 0;
        rtlStore.allChannels.forEach(channel => {
          if(channel.state === 'CHANNELD_NORMAL' && channel.connected) {
            this.openChannels++;
          } else {
            this.pendingChannels++;
          }
        });
      } else {
        this.openChannels = 0;
        this.pendingChannels = 0;
      }
      this.selNode = rtlStore.nodeSettings;
      this.information = rtlStore.information;    
      this.peers = rtlStore.peers;
      this.utxos = this.commonService.sortAscByKey(rtlStore.utxos.filter(utxo => utxo.status === 'confirmed'), 'value');
      this.totalBalance = rtlStore.balance.totalBalance;
      this.logger.info(rtlStore);
    });
  }

  onOpenChannel() {
    const peerToAddChannelMessage = {
      peers: this.peers, 
      information: this.information,
      balance: this.totalBalance,
      utxos: this.utxos,
      isCompatibleVersion: this.commonService.isVersionCompatible(this.information.version, '0.9.0') &&
      this.commonService.isVersionCompatible(this.information.api_version, '0.4.0')
    };
    this.store.dispatch(new RTLActions.OpenAlert({ data: { 
      alertTitle: 'Open Channel',
      message: peerToAddChannelMessage,
      component: CLOpenChannelComponent
    }}));
  }

  onSelectedTabChange(event) {
    this.router.navigateByUrl('/cl/connections/channels/' + this.links[event.index].link);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

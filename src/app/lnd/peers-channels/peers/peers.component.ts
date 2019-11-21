import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { Peer, GetInfo } from '../../../shared/models/lndModels';
import { LoggerService } from '../../../shared/services/logger.service';

import { newlyAddedRowAnimation } from '../../../shared/animation/row-animation';
import { LNDEffects } from '../../store/lnd.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  animations: [newlyAddedRowAnimation]
})
export class PeersComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public newlyAddedPeer = '';
  public flgAnimate = true;
  public displayedColumns = [];
  public peerAddress = '';
  public peers: any;
  public information: GetInfo = {};
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: peers
  public flgSticky = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private lndEffects: LNDEffects, private actions$: Actions, private router: Router) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['detach', 'pub_key', 'alias'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['detach', 'pub_key', 'alias', 'address', 'sat_sent', 'sat_recv'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['detach', 'open_channel', 'pub_key', 'alias', 'address', 'sat_sent', 'sat_recv', 'inbound'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['detach', 'open_channel', 'pub_key', 'alias', 'address', 'sat_sent', 'sat_recv', 'inbound', 'ping_time'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['detach', 'open_channel', 'pub_key', 'alias', 'address', 'bytes_sent', 'bytes_recv', 'sat_sent', 'sat_recv', 'inbound', 'ping_time'];
        break;
    }
  }

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsLnd.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPeers') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.peers = new MatTableDataSource([]);
      this.peers.data = [];
      if (undefined !== rtlStore.peers) {
        this.peers = new MatTableDataSource<Peer>([...rtlStore.peers]);
        this.peers.data = rtlStore.peers;
        setTimeout(() => { this.flgAnimate = false; }, 3000);
      }
      this.peers.sort = this.sort;
      if (this.flgLoading[0] !== 'error') {
        this.flgLoading[0] = false;
      }
      this.logger.info(rtlStore);
    });
    this.actions$
    .pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === RTLActions.SET_PEERS)
    ).subscribe((setPeers: RTLActions.SetPeers) => {
      this.peerAddress = undefined;
    });
  }

  onConnectPeer() {
    this.flgAnimate = true;
    const pattern = '^([a-zA-Z0-9]){1,66}@(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]):[0-9]+$';
    const deviderIndex = this.peerAddress.search('@');
    let pubkey = '';
    let host = '';

    if (new RegExp(pattern).test(this.peerAddress)) {
      pubkey = this.peerAddress.substring(0, deviderIndex);
      host = this.peerAddress.substring(deviderIndex + 1);
      this.connectPeerWithParams(pubkey, host);
    } else {
      pubkey = (deviderIndex > -1) ? this.peerAddress.substring(0, deviderIndex) : this.peerAddress;
      this.store.dispatch(new RTLActions.OpenSpinner('Getting Node Address...'));
      this.store.dispatch(new RTLActions.FetchGraphNode(pubkey));
      this.lndEffects.setGraphNode
      .pipe(take(1))
      .subscribe(graphNode => {
        host = (undefined === graphNode.node.addresses || undefined === graphNode.node.addresses[0].addr) ? '' : graphNode.node.addresses[0].addr;
        this.connectPeerWithParams(pubkey, host);
      });
    }
  }

  connectPeerWithParams(pubkey: string, host: string) {
    this.newlyAddedPeer = pubkey;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new RTLActions.SaveNewPeer({pubkey: pubkey, host: host, perm: false}));
  }

  onPeerClick(selRow: Peer, event: any) {
    const flgCloseClicked = event.target.className.includes('mat-column-detach') || event.target.className.includes('mat-icon');
    if (flgCloseClicked) {
      return;
    }
    const selPeer = this.peers.data.filter(peer => {
      return peer.pub_key === selRow.pub_key;
    })[0];
    const reorderedPeer = JSON.parse(JSON.stringify(selPeer, [
      'pub_key', 'alias', 'address', 'bytes_sent', 'bytes_recv', 'sat_sent', 'sat_recv', 'inbound', 'ping_time'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({config: { width: '75%', data: { type: 'INFO', message: JSON.stringify(reorderedPeer)}}}));
  }

  resetData() {
    this.peerAddress = '';
  }

  onOpenChannel(peerToAddChannel: Peer) {
    this.router.navigate(['lnd/chnlmanage'], { state: { peer: peerToAddChannel.pub_key }});
  }

  onPeerDetach(peerToDetach: Peer) {
    const msg = 'Detach peer: ' + peerToDetach.pub_key;
    const msg_type = 'CONFIRM';
    this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: { type: msg_type, titleMessage: msg, noBtnText: 'Cancel', yesBtnText: 'Detach'}}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[3]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Detaching Peer...'));
        this.store.dispatch(new RTLActions.DetachPeer({pubkey: peerToDetach.pub_key}));
      }
    });
  }

  applyFilter(selFilter: string) {
    this.peers.filter = selFilter;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

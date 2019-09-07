import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';

import { MatTableDataSource, MatSort } from '@angular/material';
import { PeerCL, GetInfoCL } from '../../shared/models/clModels';
import { LoggerService } from '../../shared/services/logger.service';

import { newlyAddedRowAnimation } from '../../shared/animation/row-animation';
import { CLEffects } from '../store/cl.effects';
import { RTLEffects } from '../../store/rtl.effects';
import * as RTLActions from '../../store/rtl.actions';
import * as fromRTLReducer from '../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-peers',
  templateUrl: './peers.component.html',
  styleUrls: ['./peers.component.scss'],
  animations: [newlyAddedRowAnimation]
})
export class CLPeersComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public newlyAddedPeer = '';
  public flgAnimate = true;
  public displayedColumns = [];
  public peerAddress = '';
  public peers: any;
  public information: GetInfoCL = {};
  public flgLoading: Array<Boolean | 'error'> = [true]; // 0: peers
  public flgSticky = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private rtlEffects: RTLEffects, private clEffects: CLEffects, private actions$: Actions, private router: Router) {
    switch (true) {
      case (window.innerWidth <= 415):
        this.displayedColumns = ['detach', 'id', 'alias', 'connected'];
        break;
      case (window.innerWidth > 415 && window.innerWidth <= 730):
        this.displayedColumns = ['detach', 'id', 'alias', 'connected', 'netaddr'];
        break;
      case (window.innerWidth > 730 && window.innerWidth <= 1024):
        this.displayedColumns = ['detach', 'open_channel', 'id', 'alias', 'connected', 'netaddr', 'globalfeatures', 'localfeatures'];
        break;
      case (window.innerWidth > 1024 && window.innerWidth <= 1280):
        this.flgSticky = true;
        this.displayedColumns = ['detach', 'open_channel', 'id', 'alias', 'connected', 'netaddr', 'globalfeatures', 'localfeatures'];
        break;
      default:
        this.flgSticky = true;
        this.displayedColumns = ['detach', 'open_channel', 'id', 'alias', 'connected', 'netaddr', 'globalfeatures', 'localfeatures'];
        break;
    }
  }

  ngOnInit() {
    this.store.dispatch(new RTLActions.FetchPeersCL());
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      rtlStore.effectErrorsCl.forEach(effectsErr => {
        if (effectsErr.action === 'FetchPeersCL') {
          this.flgLoading[0] = 'error';
        }
      });
      this.information = rtlStore.information;
      this.peers = new MatTableDataSource([]);
      this.peers.data = [];
      if (undefined !== rtlStore.peers) {
        this.peers = new MatTableDataSource<PeerCL>([...rtlStore.peers]);
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
      filter((action) => action.type === RTLActions.SET_PEERS_CL)
    ).subscribe((setPeers: RTLActions.SetPeersCL) => {
      this.peerAddress = undefined;
    });
  }

  onConnectPeer() {
    this.flgAnimate = true;
    this.newlyAddedPeer = this.peerAddress;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new RTLActions.SaveNewPeerCL({id: this.peerAddress}));
  }

  onPeerClick(selRow: PeerCL, event: any) {
    const flgCloseClicked = event.target.className.includes('mat-column-detach') || event.target.className.includes('mat-icon');
    if (flgCloseClicked) {
      return;
    }
    const selPeer = this.peers.data.filter(peer => {
      return peer.id === selRow.id;
    })[0];
    const reorderedPeer = JSON.parse(JSON.stringify(selPeer, [
      'id', 'alias', 'connected', 'netaddr', 'globalfeatures', 'localfeatures'
    ] , 2));
    this.store.dispatch(new RTLActions.OpenAlert({ width: '75%', data: { type: 'INFO', message: JSON.stringify(reorderedPeer)}}));
  }

  resetData() {
    this.peerAddress = '';
  }

  onOpenChannel(peerToAddChannel: PeerCL) {
    this.router.navigate(['cl/chnlmanage'], { state: { peer: peerToAddChannel.id }});
  }

  onPeerDetach(peerToDetach: PeerCL) {
    const msg = 'Detach peer: ' + peerToDetach.id;
    const msg_type = 'CONFIRM';
    this.store.dispatch(new RTLActions.OpenConfirmation({ width: '70%', data: { type: msg_type, titleMessage: msg, noBtnText: 'Cancel', yesBtnText: 'Detach'}}));
    this.rtlEffects.closeConfirm
    .pipe(takeUntil(this.unSubs[3]))
    .subscribe(confirmRes => {
      if (confirmRes) {
        this.store.dispatch(new RTLActions.OpenSpinner('Detaching Peer...'));
        this.store.dispatch(new RTLActions.DetachPeerCL({id: peerToDetach.id, force: false}));
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

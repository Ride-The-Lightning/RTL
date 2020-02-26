import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { Peer, GetInfo } from '../../../../shared/models/lndModels';
import { OpenChannelComponent } from '../../channels/open-channel-modal/open-channel.component';
import { LoggerService } from '../../../../shared/services/logger.service';

import { LNDEffects } from '../../../store/lnd.effects';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import * as RTLActions from '../../../../store/rtl.actions';

@Component({
  selector: 'rtl-connect-peer-modal',
  templateUrl: './connect-peer-modal.component.html',
  styleUrls: ['./connect-peer-modal.component.scss']
})
export class ConnectPeerModalComponent implements OnInit, OnDestroy {
  @ViewChild('peersForm', {static: true}) form: any;  
  public peerAddress = '';
  public newlyAddedPeer = '';
  public information: GetInfo = {};
  public availableBalance = 0;

  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ConnectPeerModalComponent>, private logger: LoggerService, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects) {}

  ngOnInit() {}

  onClose() {
    this.dialogRef.close(false);
  }

  onConnectPeer() {
    if(!this.peerAddress) { return true; }
    const deviderIndex = this.peerAddress.search('@');
    let pubkey = '';
    let host = '';
    if (deviderIndex > -1) {
      pubkey = this.peerAddress.substring(0, deviderIndex);
      host = this.peerAddress.substring(deviderIndex + 1);
      this.connectPeerWithParams(pubkey, host);
    } else {
      pubkey = this.peerAddress;
      this.store.dispatch(new RTLActions.OpenSpinner('Getting Node Address...'));
      this.store.dispatch(new RTLActions.FetchGraphNode(pubkey));
      this.lndEffects.setGraphNode
      .pipe(take(1))
      .subscribe(graphNode => {
        host = (!graphNode.node.addresses || !graphNode.node.addresses[0].addr) ? '' : graphNode.node.addresses[0].addr;
        this.connectPeerWithParams(pubkey, host);
      });
    }
  }

  connectPeerWithParams(pubkey: string, host: string) {
    this.newlyAddedPeer = pubkey;
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new RTLActions.SaveNewPeer({pubkey: pubkey, host: host, perm: false}));
    this.onClose();
  }

  resetData() {
    this.peerAddress = '';
    this.form.resetForm();
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

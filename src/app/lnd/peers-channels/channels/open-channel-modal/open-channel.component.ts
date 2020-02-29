import { Component, OnInit, Inject } from '@angular/core';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA, MatSnackBar } from '@angular/material';

import { Peer, GetInfo } from '../../../../shared/models/lndModels';
import { OpenChannelAlert } from '../../../../shared/models/alertData';
import { TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import { LNDEffects } from '../../../store/lnd.effects';

@Component({
  selector: 'rtl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class OpenChannelComponent implements OnInit {
  public alertTitle: string;
  public peer: Peer;
  public peers: Peer[];
  public selectedPeer = '';
  public peerAddress = '';
  public newlyAddedPeer = '';
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number;
  public isPrivate = false;
  public selTransType = '0';
  public newlyAdded = false;
  public spendUnconfirmed = false;
  public transTypeValue = {blocks: '', fees: ''};
  public transTypes = TRANS_TYPES;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];
  
  constructor(public dialogRef: MatDialogRef<OpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: OpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private actions$: Actions, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.peer = this.data.message.peer ? this.data.message.peer : null;
    this.peers = this.data.message.peers ? this.data.message.peers : [];
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.newlyAdded = this.data.newlyAdded;
    this.alertTitle = this.data.alertTitle;
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.SET_PEERS))
    .subscribe((action: RTLActions.SetPeers) => {
      if(action.type === RTLActions.SET_PEERS) {
        if(this.newlyAddedPeer !== '') {
          this.snackBar.open('Peer added successfully. Proceeding to open the channel.');
          this.peers = action.payload;
          this.peer = this.peers.find(peer => peer.pub_key === this.newlyAddedPeer);
          this.selectedPeer = this.newlyAddedPeer;
          this.newlyAddedPeer = '';
          this.onOpenChannel();
        }
      }
    });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.fundingAmount = null;
    this.isPrivate = false;
    this.spendUnconfirmed = false;
    this.selTransType = '0';
    this.transTypeValue = {blocks: '', fees: ''};
  }

  onOpenChannel() {
    if (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0) || (this.selTransType === '1' && !this.transTypeValue.blocks) || (this.selTransType === '2' && !this.transTypeValue.fees)) { return true; }
    if (this.selectedPeer !== 'new') {
      let transTypeValue = '0';
      if (this.selTransType === '1') {
        transTypeValue = this.transTypeValue.blocks;
      } else if (this.selTransType === '2') {
        transTypeValue = this.transTypeValue.fees;
      }
      this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
      this.store.dispatch(new RTLActions.SaveNewChannel({
        selectedPeerPubkey: this.selectedPeer, fundingAmount: this.fundingAmount, private: this.isPrivate,
        transType: this.selTransType, transTypeValue: transTypeValue, spendUnconfirmed: this.spendUnconfirmed
      }));
      this.dialogRef.close(false);
    } else {
      this.addNewPeer();
    }
  }

  addNewPeer() {
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
  }

}

import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { LoggerService } from '../../../../shared/services/logger.service';
import { Peer, GetInfo } from '../../../../shared/models/lndModels';
import { OpenChannelAlert } from '../../../../shared/models/alertData';
import { TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';

import { LNDEffects } from '../../../store/lnd.effects';
import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class OpenChannelComponent implements OnInit, OnDestroy {
  public faExclamationTriangle = faExclamationTriangle;
  public alertTitle: string;
  public peer: Peer;
  public peers: Peer[];
  public selectedPeer = '';
  public peerAddress = '';
  public peerConnectionError = '';
  public channelConnectionError = '';
  public flgShowAddress = false;
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number;
  public isPrivate = false;
  public selTransType = '0';
  public newlyAdded = false;
  public operation = '';
  public spendUnconfirmed = false;
  public transTypeValue = '';
  public transTypes = TRANS_TYPES;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<OpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: OpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private actions$: Actions, private logger: LoggerService) { }

  ngOnInit() {
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.operation = this.data.operation;
    this.alertTitle = this.data.alertTitle;
    this.peer = this.data.message.peer ? this.data.message.peer : null;
    this.peers = this.data.message.peers &&  this.data.message.peers.length ? this.data.message.peers : [];
    if (this.peers.length === 0 && !this.peer && this.operation === 'peer') { 
      this.flgShowAddress = true;
      this.selectedPeer = 'new';
    }
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter((action) => action.type === RTLActions.NEWLY_ADDED_PEER || action.type === RTLActions.FETCH_PENDING_CHANNELS || action.type === RTLActions.EFFECT_ERROR_LND))
    .subscribe((action: (RTLActions.NewlyAddedPeer | RTLActions.FetchPendingChannels | RTLActions.EffectErrorLnd)) => {
      if (action.type === RTLActions.NEWLY_ADDED_PEER) {
        if (!this.fundingAmount) {
          this.store.dispatch(new RTLActions.OpenSnackBar('Peer Connected Successfully.'))
          this.dialogRef.close();
        } else {
          this.peer = action.payload.peer;
          this.newlyAdded = true;
          this.flgShowAddress = false;          
          this.onOpenChannel();
        }
      }
      if (action.type === RTLActions.FETCH_PENDING_CHANNELS) { 
        this.dialogRef.close();
      }
      if (action.type === RTLActions.EFFECT_ERROR_LND) { 
        if (action.payload.action === 'SaveNewPeer' || action.payload.action === 'FetchGraphNode') {
          this.peerConnectionError = action.payload.message;
        } else if (action.payload.action === 'SaveNewChannel') {
          this.channelConnectionError = action.payload.message;
        }
      }
    });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.selectedPeer = '';
    this.flgShowAddress = false;
    this.fundingAmount = null;
    this.isPrivate = false;
    this.spendUnconfirmed = false;
    this.selTransType = '0';
    this.transTypeValue = '';
    this.peerAddress = '';
    this.peerConnectionError = '';
    this.channelConnectionError = '';
  }

  onPeerSelectionChanged(event: any) {
    this.flgShowAddress = event.value === 'new';
    this.peerAddress = '';
    this.peerConnectionError = '';
    this.channelConnectionError = '';
  }

  onConnectPeer() {
    if(!this.peerAddress || this.peerAddress.trim() === '') { return true; }
    this.peerConnectionError = '';
    const deviderIndex = this.peerAddress.search('@');
    let pubkey = '';
    let host = '';
    if (deviderIndex > -1) {
      pubkey = this.peerAddress.substring(0, deviderIndex);
      host = this.peerAddress.substring(deviderIndex + 1);
      this.connectPeerWithParams(pubkey, host);
    } else {
      this.store.dispatch(new RTLActions.OpenSpinner('Getting Node Address...'));
      this.store.dispatch(new RTLActions.FetchGraphNode({pubkey: this.peerAddress}));
      this.lndEffects.setGraphNode
      .pipe(take(1))
      .subscribe(graphNode => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        host = (!graphNode.node.addresses || !graphNode.node.addresses[0].addr) ? '' : graphNode.node.addresses[0].addr;
        this.connectPeerWithParams(this.peerAddress, host);
      });
    }
  }

  connectPeerWithParams(pubkey: string, host: string) {
    this.store.dispatch(new RTLActions.OpenSpinner('Adding Peer...'));
    this.store.dispatch(new RTLActions.SaveNewPeer({pubkey: pubkey, host: host, perm: false}));
  }

  onOpenChannel() {
    if ((!this.peer && !this.selectedPeer) || (!this.peer && this.selectedPeer === 'new' && this.peerAddress.trim() === '') || (this.operation !== 'peer' && (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0) || ((this.selTransType === '1' || this.selTransType === '2') && !this.transTypeValue)))) { return true; }
    if (!this.peer && this.selectedPeer === 'new') { 
      this.onConnectPeer(); 
    } else {
      this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
      this.store.dispatch(new RTLActions.SaveNewChannel({
        selectedPeerPubkey: ((!this.peer || !this.peer.pub_key) ? this.selectedPeer : this.peer.pub_key), fundingAmount: this.fundingAmount, private: this.isPrivate,
        transType: this.selTransType, transTypeValue: this.transTypeValue, spendUnconfirmed: this.spendUnconfirmed
      }));
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

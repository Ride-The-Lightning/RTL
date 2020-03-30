import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
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
  public channelConnectionError = '';
  public advancedTitle = 'Advanced Options';
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number;
  public isPrivate = false;
  public selTransType = '0';
  public spendUnconfirmed = false;
  public transTypeValue = '';
  public transTypes = TRANS_TYPES;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<OpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: OpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) { }

  ngOnInit() {
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.alertTitle = this.data.alertTitle;
    this.peer = this.data.message.peer ? this.data.message.peer : null;
    this.peers = this.data.message.peers &&  this.data.message.peers.length ? this.data.message.peers : [];
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === RTLActions.EFFECT_ERROR_LND))
    .subscribe((action: RTLActions.EffectErrorLnd) => {
      if (action.payload.action === 'SaveNewChannel') {
        this.channelConnectionError = action.payload.message;
      }
    });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.selectedPeer = '';
    this.fundingAmount = null;
    this.isPrivate = false;
    this.spendUnconfirmed = false;
    this.selTransType = '0';
    this.transTypeValue = '';
    this.channelConnectionError = '';
    this.advancedTitle = 'Advanced Options';
  }

  onPeerSelectionChanged(event: any) {
    this.channelConnectionError = '';
  }

  onOpenChannel() {
    if ((!this.peer && !this.selectedPeer) || (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0) || ((this.selTransType === '1' || this.selTransType === '2') && !this.transTypeValue))) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new RTLActions.SaveNewChannel({
      selectedPeerPubkey: ((!this.peer || !this.peer.pub_key) ? this.selectedPeer : this.peer.pub_key), fundingAmount: this.fundingAmount, private: this.isPrivate,
      transType: this.selTransType, transTypeValue: this.transTypeValue, spendUnconfirmed: this.spendUnconfirmed
    }));
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = 'Advanced Options | ' + (this.selTransType === '1' ? 'Target Confirmation Blocks: ' : this.selTransType === '2' ? 'Fee (Sats/Byte): ' : 'Default') + ((this.selTransType === '1' || this.selTransType === '2') ? this.transTypeValue : '') + ' | Spend Unconfirmed Output: ' + (this.spendUnconfirmed ? 'Yes' : 'No');
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

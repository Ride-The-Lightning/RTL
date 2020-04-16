import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { PeerCL, GetInfoCL } from '../../../../shared/models/clModels';
import { CLOpenChannelAlert } from '../../../../shared/models/alertData';
import { FEE_RATE_TYPES } from '../../../../shared/services/consts-enums-functions';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class CLOpenChannelComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: false }) form: any;  
  public faExclamationTriangle = faExclamationTriangle;
  public alertTitle: string;
  public peer: PeerCL;
  public peers: PeerCL[];
  public selectedPeer = '';
  public channelConnectionError = '';
  public advancedTitle = 'Advanced Options';
  public information: GetInfoCL;
  public totalBalance = 0;
  public fundingAmount: number;
  public isPrivate = false;
  public feeRateTypes = FEE_RATE_TYPES;
  public selFeeRate = '';
  public flgMinConf = false;
  public minConfValue = null;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLOpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: CLOpenChannelAlert, private store: Store<fromRTLReducer.RTLState>, private actions$: Actions) {}

  ngOnInit() {
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.alertTitle = this.data.alertTitle;
    this.peer = this.data.message.peer ? this.data.message.peer : null;
    this.peers = this.data.message.peers && this.data.message.peers.length ? this.data.message.peers : [];
    console.warn(this.data.message);
    this.actions$.pipe(takeUntil(this.unSubs[0]),
    filter(action => action.type === RTLActions.EFFECT_ERROR_CL || action.type === RTLActions.FETCH_CHANNELS_CL))
    .subscribe((action: RTLActions.EffectErrorCl | RTLActions.FetchChannelsCL) => {
      if (action.type === RTLActions.EFFECT_ERROR_CL && action.payload.action === 'SaveNewChannelCL') {
        this.channelConnectionError = action.payload.message;
      }
      if (action.type === RTLActions.FETCH_CHANNELS_CL) {
        this.dialogRef.close();
      }
    });
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.flgMinConf = false;
    this.selFeeRate = '';
    this.minConfValue = null;
    this.selectedPeer = '';
    this.fundingAmount = null;
    this.isPrivate = false;
    this.channelConnectionError = '';
    this.advancedTitle = 'Advanced Options';    
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = (!this.flgMinConf && !this.selFeeRate) ? 'Advanced Options' : 'Advanced Options | ' + (this.flgMinConf ? 'Min Confirmation Blocks: ' : 'Fee Rate: ') + (this.flgMinConf ? this.minConfValue : (this.selFeeRate ? this.feeRateTypes.find(feeRateType => feeRateType.feeRateId === this.selFeeRate).feeRateType : ''));
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  onOpenChannel() {
    if ((!this.peer && !this.selectedPeer) || (!this.fundingAmount || ((this.totalBalance - this.fundingAmount) < 0) || (this.flgMinConf && !this.minConfValue))) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new RTLActions.SaveNewChannelCL({
      peerId: ((!this.peer || !this.peer.id) ? this.selectedPeer : this.peer.id), satoshis: this.fundingAmount, announce: !this.isPrivate, feeRate: this.selFeeRate, minconf: this.flgMinConf ? this.minConfValue : null
    }));
  }

  onPeerSelectionChanged(event: any) {
    this.channelConnectionError = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

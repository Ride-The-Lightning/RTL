import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';

import { Peer, GetInfo } from '../../../models/lndModels';
import { OpenChannelAlert } from '../../../models/alertData';
import { TRANS_TYPES } from '../../../services/consts-enums-functions';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class OpenChannelComponent implements OnInit {
  public alertTitle: string;
  public peer: Peer;
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number;
  public isPrivate = false;
  public selTransType = '0';
  public newlyAdded = false;
  public spendUnconfirmed = false;
  public transTypeValue = {blocks: '', fees: ''};
  public transTypes = TRANS_TYPES;

  constructor(public dialogRef: MatDialogRef<OpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: OpenChannelAlert, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    this.peer = this.data.message.peer;
    this.information = this.data.message.information;
    this.totalBalance = this.data.message.balance;
    this.newlyAdded = this.data.newlyAdded;
    this.alertTitle = this.data.alertTitle;
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
    let transTypeValue = '0';
    if (this.selTransType === '1') {
      transTypeValue = this.transTypeValue.blocks;
    } else if (this.selTransType === '2') {
      transTypeValue = this.transTypeValue.fees;
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new RTLActions.SaveNewChannel({
      selectedPeerPubkey: this.peer.pub_key, fundingAmount: this.fundingAmount, private: this.isPrivate,
      transType: this.selTransType, transTypeValue: transTypeValue, spendUnconfirmed: this.spendUnconfirmed
    }));
    this.dialogRef.close(false);
  }

}

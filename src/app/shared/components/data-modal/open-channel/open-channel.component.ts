import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';

import { Peer, GetInfo } from '../../../models/lndModels';
import { AlertData } from '../../../models/alertData';
import { TRANS_TYPES } from '../../../models/enums';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-open-channel',
  templateUrl: './open-channel.component.html',
  styleUrls: ['./open-channel.component.scss']
})
export class OpenChannelComponent implements OnInit {
  public peer: Peer;
  public information: GetInfo;
  public totalBalance = 0;
  public fundingAmount: number;
  public isPrivate = false;
  public selTransType = '0';
  public newlyAdded = false;
  public transTypeValue = {blocks: '', fees: ''};
  public transTypes = TRANS_TYPES;

  constructor(public dialogRef: MatDialogRef<OpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: AlertData, private store: Store<fromRTLReducer.RTLState>) { }

  ngOnInit() {
    let JSONdata = JSON.parse(this.data.message);
    this.peer = JSONdata.peer;
    this.information = JSONdata.information;
    this.totalBalance = JSONdata.balance;
    this.newlyAdded = JSONdata.newlyAdded;
  }

  onClose() {
    this.dialogRef.close(false);
  }

  resetData() {
    this.fundingAmount = null;
    this.isPrivate = false;
    this.selTransType = '0';
    this.transTypeValue = {blocks: '', fees: ''};
  }

  onOpenChannel() {
    let transTypeValue = '0';
    if (this.selTransType === '1') {
      transTypeValue = this.transTypeValue.blocks;
    } else if (this.selTransType === '2') {
      transTypeValue = this.transTypeValue.fees;
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new RTLActions.SaveNewChannel({
      selectedPeerPubkey: this.peer.pub_key, fundingAmount: this.fundingAmount, private: this.isPrivate,
      transType: this.selTransType, transTypeValue: transTypeValue, spendUnconfirmed: false
    }));
    this.dialogRef.close(false);
  }

}

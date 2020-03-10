import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';

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
export class CLOpenChannelComponent implements OnInit {
  public alertTitle: string;
  public peer: PeerCL;
  public information: GetInfoCL;
  public fundingAmount: number;
  public myChanPolicy: any = {};
  public isPrivate = false;
  public feeRateTypes = FEE_RATE_TYPES;
  public totalBalance = 0;
  public newlyAdded = false;
  public selFeeRate = '';
  public flgMinConf = false;
  public minConfValue = null;
  public moreOptions = false;

  constructor(public dialogRef: MatDialogRef<CLOpenChannelComponent>, @Inject(MAT_DIALOG_DATA) public data: CLOpenChannelAlert, private store: Store<fromRTLReducer.RTLState>) {}

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
    this.fundingAmount = 0;
    this.moreOptions = false;
    this.flgMinConf = false;
    this.isPrivate = false;
    this.selFeeRate = '';
    this.minConfValue = null;
  }

  onOpenChannel() {
    if (!this.fundingAmount || (this.totalBalance - ((this.fundingAmount) ? this.fundingAmount : 0) < 0)) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Opening Channel...'));
    this.store.dispatch(new RTLActions.SaveNewChannelCL({
      peerId: this.peer.id, satoshis: this.fundingAmount, announce: !this.isPrivate, feeRate: this.selFeeRate, minconf: this.flgMinConf ? this.minConfValue : null
    }));
    this.dialogRef.close(false);
  }

}

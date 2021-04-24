import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgModel } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { faCopy, faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { PendingOpenChannel } from '../../../../shared/models/lndModels';
import { PendingOpenChannelInformation } from '../../../../shared/models/alertData';
import { TRANS_TYPES } from '../../../../shared/services/consts-enums-functions';
import { DataService } from '../../../../shared/services/data.service';

import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-bump-fee',
  templateUrl: './bump-fee.component.html',
  styleUrls: ['./bump-fee.component.scss']
})
export class BumpFeeComponent implements OnInit, OnDestroy {
  private outputIdx: NgModel;
  @ViewChild('outputIdx') set payReq(outIdx: NgModel) {if(outIdx) { this.outputIdx = outIdx; }}  
  public bumpFeeChannel: PendingOpenChannel;
  public transTypes = [...TRANS_TYPES];
  public selTransType = '2';
  public blocks = null;
  public fees = null;
  public outputIndex = null;
  public faCopy = faCopy;
  public faInfoCircle = faInfoCircle;
  public faExclamationTriangle = faExclamationTriangle;
  public bumpFeeError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<BumpFeeComponent>, @Inject(MAT_DIALOG_DATA) public data: PendingOpenChannelInformation, private store: Store<fromRTLReducer.RTLState>, private dataService: DataService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.transTypes = this.transTypes.splice(1);
    this.bumpFeeChannel = this.data.pendingChannel;
    const channelPointArr = this.bumpFeeChannel.channel && this.bumpFeeChannel.channel.channel_point ? this.bumpFeeChannel.channel.channel_point.split(':') : [];
    this.bumpFeeChannel.channel.txid_str = channelPointArr[0] ? channelPointArr[0] : (this.bumpFeeChannel.channel && this.bumpFeeChannel.channel.channel_point ? this.bumpFeeChannel.channel.channel_point : '');
    this.bumpFeeChannel.channel.output_index = channelPointArr[1] ? +channelPointArr[1] : null;
  }

  onBumpFee():boolean|void {
    if (this.outputIndex === this.bumpFeeChannel.channel.output_index) {
      this.outputIdx.control.setErrors({'pendingChannelOutputIndex': true});
      return true;
    }
    if ((!this.outputIndex && this.outputIndex !== 0) || (this.selTransType === '1' && (!this.blocks || this.blocks === 0)) || (this.selTransType === '2' && (!this.fees || this.fees === 0))) { return true; }
    this.dataService.bumpFee(this.bumpFeeChannel.channel.txid_str, this.outputIndex, this.blocks, this.fees).pipe(takeUntil(this.unSubs[0]))
    .subscribe(res => { 
      this.dialogRef.close(false);
    }, (err) => {
      console.error(err);
      this.bumpFeeError = err.message ? err.message : err;
    });
  }

  onCopyID(payload: string) {
    this.snackBar.open('Transaction ID copied.');
  }

  resetData() {
    this.bumpFeeError = '';
    this.selTransType = '2';      
    this.blocks = null;
    this.fees = null;
    this.outputIdx.control.setErrors(null);
  }

  onClose() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }
}

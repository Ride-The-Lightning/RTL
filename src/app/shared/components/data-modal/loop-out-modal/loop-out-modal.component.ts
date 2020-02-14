import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';
import { LoopQuote } from '../../../models/loopModels';
import { LoopOutAlert } from '../../../models/alertData';
import { LoopService } from '../../../services/loop.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DataTypeEnum, AlertTypeEnum } from '../../../services/consts-enums-functions';

@Component({
  selector: 'rtl-loop-out-modal',
  templateUrl: './loop-out-modal.component.html',
  styleUrls: ['./loop-out-modal.component.scss']
})
export class LoopOutModalComponent implements OnInit, OnDestroy {
  @ViewChild('loopOutForm', { static: true }) form:  any;
  public outAmount = 250000;
  public targetConf = 6;
  public fast = false;
  public quote: LoopQuote;
  public channelId: string;
  public outQuote1: LoopQuote;
  public outQuote2: LoopQuote;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LoopOutModalComponent>, @Inject(MAT_DIALOG_DATA) public data: LoopOutAlert, private store: Store<fromRTLReducer.RTLState>, private loopService: LoopService) { }

  ngOnInit() {
    this.channelId = this.data.channelId;
    this.outQuote1 = this.data.outQuote1;
    this.outQuote2 = this.data.outQuote2;
  }

  onLoopOut() {
    if(!this.outAmount || this.outAmount < 250000 || !this.targetConf || this.targetConf < 2) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Looping Out...'));
    this.loopService.loopOut(this.outAmount, this.channelId, this.targetConf, 5010, +this.quote.miner_fee, 36, +this.quote.prepay_amt, +this.quote.swap_fee).pipe(takeUntil(this.unSubs[0]))
    .subscribe((data: any) => {
      data = JSON.parse(data);
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.dialogRef.close(true);
      const loopOutStatus = [
        [{key: 'id', value: data.id, title: 'ID', width: 100, type: DataTypeEnum.STRING}],
        [{key: 'htlc_address', value: data.htlc_address, title: 'HTLC address', width: 100, type: DataTypeEnum.STRING}]
      ];
      this.store.dispatch(new RTLActions.OpenAlert({ data: {
        type: AlertTypeEnum.INFORMATION,
        alertTitle: 'Successful: Monitor the status on the loop monitor',
        message: loopOutStatus
      }}));
    }, (err) => {
      this.dialogRef.close(true);
      console.error(err);
    });
  }

  onGetQuote() {
    if(!this.outAmount || this.outAmount < 250000 || !this.targetConf || this.targetConf < 2) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Quotes...'));
    this.loopService.getLoopOutQuote(this.outAmount, this.targetConf)
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.quote = response;
    });
  }

  onReset() {
    this.form.resetForm();
    // this.targetConf = 6;
    // this.outAmount = 250000;
    // this.fast = false;
  }

  onClose() {
    this.dialogRef.close(true);
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

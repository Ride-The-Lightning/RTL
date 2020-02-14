import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { LoopQuote, LoopStatus } from '../../../models/loopModels';
import { LoopOutAlert } from '../../../models/alertData';
import { LoopService } from '../../../services/loop.service';
import { LoggerService } from '../../../services/logger.service';
import { Channel } from '../../../models/lndModels';

import * as RTLActions from '../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-loop-out-modal',
  templateUrl: './loop-out-modal.component.html',
  styleUrls: ['./loop-out-modal.component.scss']
})
export class LoopOutModalComponent implements OnInit, OnDestroy {
  @ViewChild('loopOutForm', { static: true }) form:  any;
  public faInfoCircle = faInfoCircle;
  public quote: LoopQuote;
  public channel: Channel;
  public outQuote1: LoopQuote;
  public outQuote2: LoopQuote;
  public loopOutStatus: LoopStatus = {};
  public inputFormLabel = 'Enter info to loopout';
  public quoteFormLabel = 'Confirm loopout quote';
  inputFormGroup: FormGroup;
  quoteFormGroup: FormGroup;  
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LoopOutModalComponent>, @Inject(MAT_DIALOG_DATA) public data: LoopOutAlert, private store: Store<fromRTLReducer.RTLState>, private loopService: LoopService, private formBuilder: FormBuilder, private decimalPipe: DecimalPipe, private logger: LoggerService, private router: Router) { }

  ngOnInit() {
    this.channel = this.data.channel;
    this.outQuote1 = this.data.outQuote1;
    this.outQuote2 = this.data.outQuote2;
    this.inputFormGroup = this.formBuilder.group({
      amount: [this.outQuote1.amount, [Validators.required, Validators.min(this.outQuote1.amount), Validators.max(this.outQuote2.amount)]],
      targetConf: [6, [Validators.required, Validators.min(1)]]
    });
    this.quoteFormGroup = this.formBuilder.group({});    
    this.statusFormGroup = this.formBuilder.group({}); 
  }

  onLoopOut() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.outQuote1.amount || this.inputFormGroup.controls.amount.value > this.outQuote2.amount || !this.inputFormGroup.controls.targetConf.value || this.inputFormGroup.controls.targetConf.value < 2) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Looping Out...'));
    this.loopService.loopOut(this.inputFormGroup.controls.amount.value, this.channel.chan_id, this.inputFormGroup.controls.targetConf.value, 5010, +this.quote.miner_fee, 36, +this.quote.prepay_amt, +this.quote.swap_fee).pipe(takeUntil(this.unSubs[0]))
    .subscribe((loopOutStatus: any) => {
      this.loopOutStatus = JSON.parse(loopOutStatus);
      this.store.dispatch(new RTLActions.CloseSpinner());
    }, (err) => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.loopOutStatus.error = err.error;
      this.logger.error(err);
    });
  }

  onEstimateQuote() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.outQuote1.amount || this.inputFormGroup.controls.amount.value > this.outQuote2.amount || !this.inputFormGroup.controls.targetConf.value || this.inputFormGroup.controls.targetConf.value < 2) { return true; }
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Quotes...'));
    this.loopService.getLoopOutQuote(this.inputFormGroup.controls.amount.value, this.inputFormGroup.controls.targetConf.value)
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.quote = response;
    });
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.inputFormLabel = 'Enter info to loopout';
        this.quoteFormLabel = (this.inputFormGroup.controls.amount.value) ? 'Confirm loopout quote for ' + this.decimalPipe.transform(this.inputFormGroup.controls.amount.value) + ' Sats' : 'Confirm loopout quote';
        break;
    
      case 1:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.targetConf.value) {
          this.inputFormLabel = 'Loopout Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.targetConf.value ? this.inputFormGroup.controls.targetConf.value : 6);
        } else {
          this.inputFormLabel = 'Enter info to loopout';
        }
        this.quoteFormLabel = (this.inputFormGroup.controls.amount.value) ? 'Confirm loopout quote for ' + this.decimalPipe.transform(this.inputFormGroup.controls.amount.value) + ' Sats' : 'Confirm loopout quote';
        break;

      case 2:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.targetConf.value) {
          this.inputFormLabel = 'Loopout Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.targetConf.value ? this.inputFormGroup.controls.targetConf.value : 6);
        } else {
          this.inputFormLabel = 'Enter info to loopout';
        }
        if (this.quote && this.quote.amount) {
          this.quoteFormLabel = 'Loopout confirmed for amount: ' + this.decimalPipe.transform(this.quote.amount ? this.quote.amount : 0) + ' Sats';
        } else {
          this.quoteFormLabel = (this.inputFormGroup.controls.amount.value) ? 'Confirm loopout quote for ' + this.decimalPipe.transform(this.inputFormGroup.controls.amount.value) + ' Sats' : 'Confirm loopout quote';
        }
        break;

      default:
        this.inputFormLabel = 'Enter info to loopout';
        this.quoteFormLabel = 'Confirm loopout quote';
        break;
    }
  }

  goToLoop() {
    this.dialogRef.close(true);
    this.router.navigateByUrl('/lnd/loop');
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

import { Component, OnInit, Inject, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA, MatVerticalStepper } from '@angular/material';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { LoopQuote, LoopStatus } from '../../../shared/models/loopModels';
import { LoopAlert } from '../../../shared/models/alertData';
import { LoopService } from '../../../shared/services/loop.service';
import { LoggerService } from '../../../shared/services/logger.service';

import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-loop-in-modal',
  templateUrl: './loop-in-modal.component.html',
  styleUrls: ['./loop-in-modal.component.scss']
})
export class LoopInModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faInfoCircle = faInfoCircle;
  public quote: LoopQuote;
  public minQuote: LoopQuote;
  public maxQuote: LoopQuote;
  public loopInStatus: LoopStatus = null;
  public inputFormLabel = 'Amount to loop-in';
  public quoteFormLabel = 'Confirm Quote';
  public flgEditable = true;
  inputFormGroup: FormGroup;
  quoteFormGroup: FormGroup;  
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LoopInModalComponent>, @Inject(MAT_DIALOG_DATA) public data: LoopAlert, private store: Store<fromRTLReducer.RTLState>, private loopService: LoopService, private formBuilder: FormBuilder, private decimalPipe: DecimalPipe, private logger: LoggerService, private router: Router) { }

  ngOnInit() {
    this.minQuote = this.data.minQuote ? this.data.minQuote : {};
    this.maxQuote = this.data.maxQuote ? this.data.maxQuote : {};
    this.inputFormGroup = this.formBuilder.group({
      amount: [this.minQuote.amount, [Validators.required, Validators.min(this.minQuote.amount), Validators.max(this.maxQuote.amount)]],
      targetConf: [6, [Validators.required, Validators.min(1)]]
    });
    this.quoteFormGroup = this.formBuilder.group({});    
    this.statusFormGroup = this.formBuilder.group({}); 
  }

  ngAfterViewInit() {
    this.inputFormGroup.setErrors({'Invalid': true});
    this.quoteFormGroup.setErrors({'Invalid': true});
  }

  onLoopIn() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.minQuote.amount || this.inputFormGroup.controls.amount.value > this.maxQuote.amount || !this.inputFormGroup.controls.targetConf.value || this.inputFormGroup.controls.targetConf.value < 2) { return true; }
    this.flgEditable = false;
    this.stepper.selected.stepControl.setErrors(null);
    this.stepper.next();
    this.loopService.loopIn(this.inputFormGroup.controls.amount.value, +this.quote.swap_fee, +this.quote.miner_fee, '', true).pipe(takeUntil(this.unSubs[0]))
    .subscribe((loopInStatus: any) => {
      this.loopInStatus = JSON.parse(loopInStatus);
      this.store.dispatch(new RTLActions.FetchLoopSwaps());
      this.flgEditable = true;
    }, (err) => {
      this.loopInStatus.error = err.error;
      this.flgEditable = true;
      this.logger.error(err);
    });
  }

  onEstimateQuote() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.minQuote.amount || this.inputFormGroup.controls.amount.value > this.maxQuote.amount || !this.inputFormGroup.controls.targetConf.value || this.inputFormGroup.controls.targetConf.value < 2) { return true; }
    this.stepper.selected.stepControl.setErrors(null);
    this.stepper.next();
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Quotes...'));
    this.loopService.getLoopInQuote(this.inputFormGroup.controls.amount.value, this.inputFormGroup.controls.targetConf.value)
    .pipe(takeUntil(this.unSubs[1]))
    .subscribe(response => {
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.quote = response;
    });
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.inputFormLabel = 'Amount to loop-in';
        this.quoteFormLabel = 'Confirm Quote';
        break;
    
      case 1:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.targetConf.value) {
          this.inputFormLabel = 'Loop-in Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.targetConf.value ? this.inputFormGroup.controls.targetConf.value : 6);
        } else {
          this.inputFormLabel = 'Amount to loop-in';
        }
        this.quoteFormLabel = 'Confirm Quote';
        break;

      case 2:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.targetConf.value) {
          this.inputFormLabel = 'Loop-in Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.targetConf.value ? this.inputFormGroup.controls.targetConf.value : 6);
        } else {
          this.inputFormLabel = 'Amount to loop-in';
        }
        if (this.quote && this.quote.swap_fee && this.quote.miner_fee && this.quote.prepay_amt) {
          this.quoteFormLabel = 'Quote confirmed | Estimated Fees: ' + this.decimalPipe.transform(+this.quote.swap_fee + +this.quote.miner_fee) + ' Sats';
        } else {
          this.quoteFormLabel = 'Quote confirmed';
        }
        break;

      default:
        this.inputFormLabel = 'Amount to loop-in';
        this.quoteFormLabel = 'Confirm Quote';
        break;
    }
    if (event.selectedIndex < event.previouslySelectedIndex) {
      event.selectedStep.stepControl.setErrors({'Invalid': true});
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

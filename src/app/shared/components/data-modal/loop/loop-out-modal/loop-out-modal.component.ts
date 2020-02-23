import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { ScreenSizeEnum } from '../../../../services/consts-enums-functions';
import { LoopQuote, LoopStatus } from '../../../../models/loopModels';
import { LoopAlert } from '../../../../models/alertData';
import { LoopService } from '../../../../services/loop.service';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';
import { Channel } from '../../../../models/lndModels';
import { opacityAnimation } from '../../../../../shared/animation/opacity-animation';

import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-loop-out-modal',
  templateUrl: './loop-out-modal.component.html',
  styleUrls: ['./loop-out-modal.component.scss'],
  animations: [opacityAnimation]
})
export class LoopOutModalComponent implements OnInit, OnDestroy {
  public faInfoCircle = faInfoCircle;
  public quote: LoopQuote;
  public channel: Channel;
  public minQuote: LoopQuote;
  public maxQuote: LoopQuote;
  public loopOutStatus: LoopStatus = null;
  public inputFormLabel = 'Amount to loop-out';
  public quoteFormLabel = 'Confirm Quote';
  public prepayRoutingFee = 36;
  public flgShowInfo = false;
  public stepNumber = 1;
  public stepDirection = 'NEXT';
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  inputFormGroup: FormGroup;
  quoteFormGroup: FormGroup;  
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LoopOutModalComponent>, @Inject(MAT_DIALOG_DATA) public data: LoopAlert, private store: Store<fromRTLReducer.RTLState>, private loopService: LoopService, private formBuilder: FormBuilder, private decimalPipe: DecimalPipe, private logger: LoggerService, private router: Router, private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.channel = this.data.channel;
    this.minQuote = this.data.minQuote ? this.data.minQuote : {};
    this.maxQuote = this.data.maxQuote ? this.data.maxQuote : {};
    this.inputFormGroup = this.formBuilder.group({
      amount: [this.minQuote.amount, [Validators.required, Validators.min(this.minQuote.amount), Validators.max(this.maxQuote.amount)]],
      targetConf: [6, [Validators.required, Validators.min(1)]]
    });
    this.quoteFormGroup = this.formBuilder.group({});    
    this.statusFormGroup = this.formBuilder.group({}); 
  }

  onLoopOut() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.minQuote.amount || this.inputFormGroup.controls.amount.value > this.maxQuote.amount || !this.inputFormGroup.controls.targetConf.value || this.inputFormGroup.controls.targetConf.value < 2) { return true; }
    const swapRoutingFee = this.inputFormGroup.controls.amount.value * 0.02;
    this.loopService.loopOut(this.inputFormGroup.controls.amount.value, (this.channel && this.channel.chan_id ? this.channel.chan_id : ''), this.inputFormGroup.controls.targetConf.value, swapRoutingFee, +this.quote.miner_fee, this.prepayRoutingFee, +this.quote.prepay_amt, +this.quote.swap_fee).pipe(takeUntil(this.unSubs[0]))
    .subscribe((loopOutStatus: any) => {
      this.loopOutStatus = JSON.parse(loopOutStatus);
      this.store.dispatch(new RTLActions.FetchLoopSwaps());
    }, (err) => {
      this.loopOutStatus.error = err.error;
      this.logger.error(err);
    });
  }

  onEstimateQuote() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.minQuote.amount || this.inputFormGroup.controls.amount.value > this.maxQuote.amount || !this.inputFormGroup.controls.targetConf.value || this.inputFormGroup.controls.targetConf.value < 2) { return true; }
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
        this.inputFormLabel = 'Amount to loop-out';
        this.quoteFormLabel = 'Confirm Quote';
        break;
    
      case 1:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.targetConf.value) {
          this.inputFormLabel = 'Loop-out Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.targetConf.value ? this.inputFormGroup.controls.targetConf.value : 6);
        } else {
          this.inputFormLabel = 'Amount to loop-out';
        }
        this.quoteFormLabel = 'Confirm Quote';
        break;

      case 2:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.targetConf.value) {
          this.inputFormLabel = 'Loop-out Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.targetConf.value ? this.inputFormGroup.controls.targetConf.value : 6);
        } else {
          this.inputFormLabel = 'Amount to loop-out';
        }
        if (this.quote && this.quote.swap_fee && this.quote.miner_fee && this.quote.prepay_amt) {
          this.quoteFormLabel = 'Quote confirmed | Estimated Fees: ' + this.decimalPipe.transform(+this.quote.swap_fee + +this.quote.miner_fee) + ' Sats';
        } else {
          this.quoteFormLabel = 'Quote confirmed';
        }
        break;

      default:
        this.inputFormLabel = 'Amount to loop-out';
        this.quoteFormLabel = 'Confirm Quote';
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

  showInfo() {
    this.flgShowInfo = true;
  }

  onBack() {
    if(this.stepNumber > 1) {
      this.stepDirection = 'BACK';
      this.stepNumber--;
    }
  }
  
  onNext() {
    if(this.stepNumber < 5) {
      this.stepDirection = 'NEXT';
      this.stepNumber++;
    }
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

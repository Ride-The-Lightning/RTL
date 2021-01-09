import { Component, OnInit, Inject, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { opacityAnimation } from '../../../../animation/opacity-animation';
import { ScreenSizeEnum, SwapTypeEnum } from '../../../../services/consts-enums-functions';
import { ServiceInfo, CreateSwapResponse, CreateReverseSwapResponse } from '../../../../models/boltzModels';
import { SwapAlert } from '../../../../models/alertData';
import { BoltzService } from '../../../../services/boltz.service';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';
import { Channel } from '../../../../models/lndModels';

import * as LNDActions from '../../../../../lnd/store/lnd.actions';
import * as RTLActions from '../../../../../store/rtl.actions';
import * as fromRTLReducer from '../../../../../store/rtl.reducers';

@Component({
  selector: 'rtl-boltz-swap-modal',
  templateUrl: './swap-modal.component.html',
  styleUrls: ['./swap-modal.component.scss'],
  animations: [opacityAnimation]
})
export class SwapModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faInfoCircle = faInfoCircle;
  public serviceInfo: ServiceInfo;
  public channel: Channel;
  public swapTypeEnum = SwapTypeEnum;
  public direction = SwapTypeEnum.SWAP_OUT;
  public swapDirectionCaption = 'Swap out';
  public swapStatus = null;
  public inputFormLabel = 'Amount to swap out';
  public quoteFormLabel = 'Confirm Amount';
  public addressFormLabel = 'Withdrawal Address';
  public maxRoutingFeePercentage = 2;
  public prepayRoutingFee = 36;
  public flgShowInfo = false;
  public stepNumber = 1;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public animationDirection = 'forward';
  public flgEditable = true;
  public localBalanceToCompare = null;
  inputFormGroup: FormGroup;
  quoteFormGroup: FormGroup;
  addressFormGroup: FormGroup;
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<SwapModalComponent>, @Inject(MAT_DIALOG_DATA) public data: SwapAlert, private store: Store<fromRTLReducer.RTLState>, private boltzService: BoltzService, private formBuilder: FormBuilder, private decimalPipe: DecimalPipe, private logger: LoggerService, private router: Router, private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.channel = this.data.channel;
    this.direction = this.data.direction;
    this.swapDirectionCaption = this.direction === SwapTypeEnum.SWAP_OUT ? 'Swap in' : 'Swap out';
    this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;    
    this.inputFormGroup = this.formBuilder.group({
      amount: [this.serviceInfo.limits.minimal, [Validators.required, Validators.min(this.serviceInfo.limits.minimal), Validators.max(this.serviceInfo.limits.maximal)]],
      sweepConfTarget: [6, [Validators.required, Validators.min(1)]],
      routingFeePercent: [this.maxRoutingFeePercentage, [Validators.required, Validators.min(0), Validators.max(this.maxRoutingFeePercentage)]],
      fast: [false, [Validators.required]]
    });
    this.quoteFormGroup = this.formBuilder.group({});
    this.addressFormGroup = this.formBuilder.group({
      addressType: ['local', [Validators.required]],
      address: [{value: '', disabled: true}]
    });
    this.statusFormGroup = this.formBuilder.group({});
    this.onFormValueChanges();
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[6]))
    .subscribe((rtlStore) => {
      this.localBalanceToCompare = (this.channel) ? +this.channel.local_balance : +rtlStore.totalLocalBalance;
    });
  }

  ngAfterViewInit() {
    this.inputFormGroup.setErrors({'Invalid': true});
    if (this.direction === SwapTypeEnum.SWAP_OUT) {
      this.addressFormGroup.setErrors({'Invalid': true});
    }
  }

  onFormValueChanges() {
    this.inputFormGroup.valueChanges.pipe(takeUntil(this.unSubs[4])).subscribe(changedValues => {
      this.inputFormGroup.setErrors({'Invalid': true});
    });
    if (this.direction === SwapTypeEnum.SWAP_OUT) {
      this.addressFormGroup.valueChanges.pipe(takeUntil(this.unSubs[5])).subscribe(changedValues => {
        this.addressFormGroup.setErrors({'Invalid': true});
      });
    }
  }

  onAddressTypeChange(event: any) {
    if (event.value === 'external') {
      this.addressFormGroup.controls.address.setValidators([Validators.required]);
      this.addressFormGroup.controls.address.markAsTouched();
      this.addressFormGroup.controls.address.enable();
    } else {
      this.addressFormGroup.controls.address.setValidators(null);
      this.addressFormGroup.controls.address.markAsPristine();
      this.addressFormGroup.controls.address.disable();
      this.addressFormGroup.controls.address.setValue('');
    }
    this.addressFormGroup.setErrors({'Invalid': true});
  }

  onValidateAmount() {
    if (this.inputFormGroup.controls.amount.value <= this.localBalanceToCompare) {
      this.stepper.next();
    }
  }

  onSwap():boolean|void {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.serviceInfo.limits.minimal || this.inputFormGroup.controls.amount.value > this.serviceInfo.limits.maximal || !this.inputFormGroup.controls.sweepConfTarget.value || this.inputFormGroup.controls.sweepConfTarget.value < 2 || (this.direction === SwapTypeEnum.SWAP_OUT && (!this.inputFormGroup.controls.routingFeePercent.value || this.inputFormGroup.controls.routingFeePercent.value < 0 || this.inputFormGroup.controls.routingFeePercent.value > this.maxRoutingFeePercentage)) || (this.direction === SwapTypeEnum.SWAP_OUT && this.addressFormGroup.controls.addressType.value === 'external' && (!this.addressFormGroup.controls.address.value || this.addressFormGroup.controls.address.value.trim() === ''))) { return true; }
    this.flgEditable = false;
    this.stepper.selected.stepControl.setErrors(null);
    this.stepper.next();
    if (this.direction === SwapTypeEnum.SWAP_IN) {
      this.boltzService.swapIn(this.inputFormGroup.controls.amount.value, '', true).pipe(takeUntil(this.unSubs[0]))
      .subscribe((swapStatus: any) => {
        this.swapStatus = swapStatus;
        // this.store.dispatch(new LNDActions.FetchLoopSwaps());
        this.flgEditable = true;
      }, (err) => {
        this.swapStatus = { error: err.error.error ? err.error.error : err.error ? err.error : err };
        this.flgEditable = true;
        this.logger.error(err);
      });
    } else {
      let swapRoutingFee = Math.ceil(this.inputFormGroup.controls.amount.value * (this.inputFormGroup.controls.routingFeePercent.value / 100));
      let destAddress = this.addressFormGroup.controls.addressType.value === 'external' ? this.addressFormGroup.controls.address.value : '';
      let swapPublicationDeadline = this.inputFormGroup.controls.fast.value ? 0 : new Date().getTime() + (30 * 60000);
      this.boltzService.swapOut(this.inputFormGroup.controls.amount.value, destAddress, true).pipe(takeUntil(this.unSubs[1]))
      .subscribe((swapStatus: any) => {
        this.swapStatus = swapStatus;
        // this.store.dispatch(new LNDActions.FetchLoopSwaps());
        this.flgEditable = true;
      }, (err) => {
        this.swapStatus = { error: err.error.error ? err.error.error : err.error ? err.error : err };
        this.flgEditable = true;
        this.logger.error(err);
      });
    }
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
        this.quoteFormLabel = 'Confirm Quote';
        this.addressFormLabel = 'Withdrawal Address';
        break;
    
      case 1:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.sweepConfTarget.value) {
          if (this.direction === SwapTypeEnum.SWAP_IN) {
            this.inputFormLabel = this.swapDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6);
          } else {
            this.inputFormLabel = this.swapDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6) + ' | Percentage: ' +  (this.inputFormGroup.controls.routingFeePercent.value ? this.inputFormGroup.controls.routingFeePercent.value : '2') + ' | Fast: ' + (this.inputFormGroup.controls.fast.value ? 'Enabled' : 'Disabled');
          }
        } else {
          this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
        }
        this.quoteFormLabel = 'Confirm Quote';
        this.addressFormLabel = 'Withdrawal Address';
        break;

      case 2:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.sweepConfTarget.value) {
          if (this.direction === SwapTypeEnum.SWAP_IN) {
            this.inputFormLabel = this.swapDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6);
          } else {
            this.inputFormLabel = this.swapDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6) + ' | Fast: ' + (this.inputFormGroup.controls.fast.value ? 'Enabled' : 'Disabled');
          }
        } else {
          this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
        }
        if (this.serviceInfo.limits.minimal) {
          this.quoteFormLabel = 'Quote confirmed | Estimated Fees: ' + this.decimalPipe.transform(+this.serviceInfo.limits.minimal) + ' Sats';
        } else {
          this.quoteFormLabel = 'Quote confirmed';
        }
        if (this.addressFormGroup.controls.addressType.value) {
          this.addressFormLabel = 'Withdrawal Address | Type: ' + this.addressFormGroup.controls.addressType.value;
        } else {
          this.addressFormLabel = 'Withdrawal Address';
        }
        break;

      default:
        this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
        this.quoteFormLabel = 'Confirm Quote';
        this.addressFormLabel = 'Withdrawal Address';        
        break;
    }
    if ((this.direction === SwapTypeEnum.SWAP_IN && event.selectedIndex !== 1 && event.selectedIndex < event.previouslySelectedIndex)
    || (this.direction === SwapTypeEnum.SWAP_IN && event.selectedIndex < event.previouslySelectedIndex)) {
      event.selectedStep.stepControl.setErrors({'Invalid': true});
    }
  }

  goToSwap() {
    this.dialogRef.close(true);
    this.router.navigateByUrl('/services/boltz');
  }

  onClose() {
    this.dialogRef.close(true);
  }

  showInfo() {
    this.flgShowInfo = true;
  }

  onReadMore() {
    if (this.direction === SwapTypeEnum.SWAP_IN) {
      window.open('https://blog.lightning.engineering/announcement/2019/06/25/loop-in.html', '_blank');
    } else {
      window.open('https://blog.lightning.engineering/technical/posts/2019/04/15/loop-out-in-depth.html', '_blank');
    }
    this.onClose();
  }

  onStepChanged(index: number) {
    this.animationDirection = index < this.stepNumber ? 'backward' : 'forward';
    this.stepNumber = index;
  }

  onRestart() {
    this.stepper.reset();
    this.flgEditable = true;
    this.inputFormGroup.reset({ amount: this.serviceInfo.limits.minimal, sweepConfTarget: 6, routingFeePercent: this.maxRoutingFeePercentage, fast: false });
    this.quoteFormGroup.reset();
    this.statusFormGroup.reset();
    this.addressFormGroup.reset({addressType: 'local', address: ''});
    this.addressFormGroup.controls.address.disable();
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

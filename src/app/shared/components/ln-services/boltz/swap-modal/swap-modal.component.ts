import { Component, OnInit, Inject, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { opacityAnimation } from '../../../../animation/opacity-animation';
import { ScreenSizeEnum, SwapTypeEnum } from '../../../../services/consts-enums-functions';
import { ServiceInfo, CreateSwapResponse, CreateReverseSwapResponse, BoltzInfo } from '../../../../models/boltzModels';
import { SwapAlert } from '../../../../models/alertData';
import { BoltzService } from '../../../../services/boltz.service';
import { LoggerService } from '../../../../services/logger.service';
import { CommonService } from '../../../../services/common.service';

@Component({
  selector: 'rtl-boltz-swap-modal',
  templateUrl: './swap-modal.component.html',
  styleUrls: ['./swap-modal.component.scss'],
  animations: [opacityAnimation]
})
export class SwapModalComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('stepper', { static: false }) stepper: MatStepper;
  public faInfoCircle = faInfoCircle;
  public boltzInfo: BoltzInfo = null;
  public serviceInfo: ServiceInfo = { fees: { percentage: null, miner: { normal: null, reverse: null } }, limits: { minimal: 10000, maximal: 50000000 } };
  public swapTypeEnum = SwapTypeEnum;
  public direction = SwapTypeEnum.SWAP_OUT;
  public swapDirectionCaption = 'Swap out';
  public swapStatus: CreateSwapResponse | CreateReverseSwapResponse | { error: any } | null = null;
  public inputFormLabel = 'Amount to swap out';
  public addressFormLabel = 'Withdrawal Address';
  public flgShowInfo = false;
  public stepNumber = 1;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public animationDirection = 'forward';
  public flgEditable = true;
  public isSendFromInternalCompatible = true;
  inputFormGroup: UntypedFormGroup;
  addressFormGroup: UntypedFormGroup;
  statusFormGroup: UntypedFormGroup;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<SwapModalComponent>, @Inject(MAT_DIALOG_DATA) public data: SwapAlert, private boltzService: BoltzService, private formBuilder: UntypedFormBuilder, private decimalPipe: DecimalPipe, private logger: LoggerService, private commonService: CommonService) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.serviceInfo = this.data.serviceInfo;
    this.direction = this.data.direction || SwapTypeEnum.SWAP_OUT;
    this.swapDirectionCaption = this.direction === SwapTypeEnum.SWAP_OUT ? 'Swap Out' : 'Swap in';
    this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
    this.inputFormGroup = this.formBuilder.group({
      amount: [this.serviceInfo.limits?.minimal, [Validators.required, Validators.min(this.serviceInfo.limits?.minimal || 0), Validators.max(this.serviceInfo.limits?.maximal || 0)]],
      acceptZeroConf: [false],
      sendFromInternal: [true]
    });
    this.addressFormGroup = this.formBuilder.group({
      addressType: ['local', [Validators.required]],
      address: [{ value: '', disabled: true }]
    });
    this.statusFormGroup = this.formBuilder.group({});
    this.onFormValueChanges();
    this.boltzService.boltzInfoChanged.
      pipe(takeUntil(this.unSubs[0])).
      subscribe({
        next: (boltzInfo: BoltzInfo) => {
          this.boltzInfo = boltzInfo;
          this.isSendFromInternalCompatible = this.commonService.isVersionCompatible(this.boltzInfo.version, '2.0.0');
        }, error: (err) => {
          this.boltzInfo = { version: '2.0.0' };
          this.logger.error(err);
        }
      });
  }

  ngAfterViewInit() {
    if (this.direction === SwapTypeEnum.SWAP_OUT) {
      this.addressFormGroup.setErrors({ Invalid: true });
    }
  }

  onFormValueChanges() {
    if (this.direction === SwapTypeEnum.SWAP_OUT) {
      this.addressFormGroup.valueChanges.pipe(takeUntil(this.unSubs[1])).subscribe((changedValues) => {
        this.addressFormGroup.setErrors({ Invalid: true });
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
    this.addressFormGroup.setErrors({ Invalid: true });
  }

  onSwap(): boolean | void {
    if (!this.inputFormGroup.controls.amount.value || (this.serviceInfo.limits?.minimal && this.inputFormGroup.controls.amount.value < +this.serviceInfo.limits.minimal) || (this.serviceInfo.limits?.maximal && this.inputFormGroup.controls.amount.value > +this.serviceInfo.limits.maximal) ||
      (this.direction === SwapTypeEnum.SWAP_OUT && this.addressFormGroup.controls.addressType.value === 'external' &&
        (!this.addressFormGroup.controls.address.value || this.addressFormGroup.controls.address.value.trim() === ''))) {
      return true;
    }
    this.flgEditable = false;
    this.stepper.selected?.stepControl.setErrors(null);
    this.stepper.next();
    if (this.direction === SwapTypeEnum.SWAP_IN) {
      this.boltzService.swapIn(this.inputFormGroup.controls.amount.value, this.isSendFromInternalCompatible ? this.inputFormGroup.controls.sendFromInternal.value : null).pipe(takeUntil(this.unSubs[2])).
        subscribe({
          next: (swapStatus: CreateSwapResponse) => {
            this.swapStatus = swapStatus;
            this.boltzService.listSwaps();
            this.flgEditable = true;
          },
          error: (err) => {
            this.swapStatus = { error: err };
            this.flgEditable = true;
            this.logger.error(err);
          }
        });
    } else {
      const destAddress = this.addressFormGroup.controls.addressType.value === 'external' ? this.addressFormGroup.controls.address.value : '';
      this.boltzService.swapOut(this.inputFormGroup.controls.amount.value, destAddress, this.inputFormGroup.controls.acceptZeroConf.value).pipe(takeUntil(this.unSubs[3])).
        subscribe({
          next: (swapStatus: CreateReverseSwapResponse) => {
            this.swapStatus = swapStatus;
            this.boltzService.listSwaps();
            this.flgEditable = true;
          },
          error: (err) => {
            this.swapStatus = { error: err };
            this.flgEditable = true;
            this.logger.error(err);
          }
        });
    }
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 0:
        this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
        this.addressFormLabel = 'Withdrawal Address';
        break;

      case 1:
        if (this.inputFormGroup.controls.amount.value) {
          if (this.direction === SwapTypeEnum.SWAP_IN) {
            this.inputFormLabel = this.swapDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Send from Internal Wallet: ' + (this.inputFormGroup.controls.sendFromInternal.value ? 'Yes' : 'No');
          } else {
            this.inputFormLabel = this.swapDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Zero Conf: ' + (this.inputFormGroup.controls.acceptZeroConf.value ? 'Yes' : 'No');
          }
        } else {
          this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
        }
        this.addressFormLabel = 'Withdrawal Address';
        break;

      default:
        this.inputFormLabel = 'Amount to ' + this.swapDirectionCaption;
        this.addressFormLabel = 'Withdrawal Address';
        break;
    }
    if (event.selectedIndex < event.previouslySelectedIndex) {
      event.selectedStep.stepControl.setErrors({ Invalid: true });
    }
  }

  onClose() {
    this.dialogRef.close(true);
  }

  showInfo() {
    this.flgShowInfo = true;
  }

  onReadMore() {
    if (this.direction === SwapTypeEnum.SWAP_IN) {
      window.open('https://docs.boltz.exchange/en/latest/lifecycle/#normal-submarine-swaps', '_blank');
    } else {
      window.open('https://docs.boltz.exchange/en/latest/lifecycle/#reverse-submarine-swaps', '_blank');
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
    this.inputFormGroup.reset({ amount: this.serviceInfo.limits?.minimal, acceptZeroConf: false, sendFromInternal: true });
    this.statusFormGroup.reset();
    this.addressFormGroup.reset({ addressType: 'local', address: '' });
    this.addressFormGroup.controls.address.disable();
    this.swapStatus = null;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

import { Component, OnInit, Inject, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatVerticalStepper } from '@angular/material/stepper';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { opacityAnimation } from '../../../shared/animation/opacity-animation';
import { ScreenSizeEnum, SwapProviderEnum, SwapTypeEnum, SwapStateEnum } from '../../../shared/services/consts-enums-functions';
import { LoopQuote, LoopStatus } from '../../../shared/models/loopModels';
import { LoopAlert } from '../../../shared/models/alertData';
import { LoopService } from '../../../shared/services/loop.service';
import { BoltzService } from '../../../shared/services/boltz.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CommonService } from '../../../shared/services/common.service';
import { Channel } from '../../../shared/models/lndModels';

import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';
import { LNDEffects } from '../../store/lnd.effects';
import { AddressType } from '../../../shared/models/lndModels';
import { ADDRESS_TYPES } from '../../../shared/services/consts-enums-functions';


@Component({
  selector: 'rtl-loop-modal',
  templateUrl: './loop-modal.component.html',
  styleUrls: ['./loop-modal.component.scss'],
  animations: [opacityAnimation]
})
export class LoopModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('stepper', { static: false }) stepper: MatVerticalStepper;
  public faInfoCircle = faInfoCircle;
  public quote: LoopQuote;
  public channel: Channel;
  public minQuote: LoopQuote;
  public maxQuote: LoopQuote;
  public swapProviderEnum = SwapProviderEnum;
  public swapProvider = SwapProviderEnum.BOLTZ;
  public swapTypeEnum = SwapTypeEnum;
  public direction = SwapTypeEnum.WITHDRAWAL;
  public loopDirectionCaption = 'Withdrawal';
  public loopStatus: LoopStatus = null;
  public providerFormLabel = 'Choose Lightning Service Provider';
  public inputFormLabel = 'Amount to Withdrawal';
  public quoteFormLabel = 'Confirm Quote';
  public addressFormLabel = 'Withdrawal Address';
  public maxRoutingFeePercentage = 2;
  public prepayRoutingFee = 36;
  public flgShowInfo = false;
  public stepNumber = 1;
  public screenSize = '';
  public screenSizeEnum = ScreenSizeEnum;
  public animationDirection = 'forward';
  public flgEditable = true;
  providerFormGroup: FormGroup;
  inputFormGroup: FormGroup;
  quoteFormGroup: FormGroup;
  addressFormGroup: FormGroup;
  statusFormGroup: FormGroup;  
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];
  private targetConf = 2;
  public addressTypes = ADDRESS_TYPES;
  public selectedAddressType: AddressType = ADDRESS_TYPES[0];

  constructor(public dialogRef: MatDialogRef<LoopModalComponent>, @Inject(MAT_DIALOG_DATA) public data: LoopAlert, private store: Store<fromRTLReducer.RTLState>, private boltzService: BoltzService, private loopService: LoopService, private formBuilder: FormBuilder, private decimalPipe: DecimalPipe, private logger: LoggerService, private router: Router, private commonService: CommonService, private actions$: Actions, private lndEffects: LNDEffects) { }

  ngOnInit() {
    this.screenSize = this.commonService.getScreenSize();
    this.channel = this.data.channel;
    this.minQuote = this.data.minQuote ? this.data.minQuote : {};
    this.maxQuote = this.data.maxQuote ? this.data.maxQuote : {};
    this.direction = this.data.direction;
    this.loopDirectionCaption = this.direction === SwapTypeEnum.DEPOSIT ? 'Deposit' : 'Withdrawal';
    this.inputFormLabel = 'Amount to ' + this.loopDirectionCaption;
    this.quoteFormLabel = 'Confirm Quote';
    this.providerFormGroup = this.formBuilder.group({
      provider: [this.swapProvider, [Validators.required]]
    });  
    this.inputFormGroup = this.formBuilder.group({
      amount: [this.minQuote.amount, [Validators.required, Validators.min(this.minQuote.amount), Validators.max(this.maxQuote.amount)]],
      sweepConfTarget: [6, [Validators.required, Validators.min(1)]],
      routingFeePercent: [this.maxRoutingFeePercentage, [Validators.required, Validators.min(0), Validators.max(this.maxRoutingFeePercentage)]],
      fast: [false, [Validators.required]]
    });
    this.quoteFormGroup = this.formBuilder.group({
      downloadRefundFile: [false, [Validators.required]]
    });
    this.addressFormGroup = this.formBuilder.group({
      addressType: ['local', [Validators.required]],
      address: [{value: '', disabled: true}]
    });
    this.statusFormGroup = this.formBuilder.group({});
    this.onFormValueChanges();
  }

  ngAfterViewInit() {
    this.inputFormGroup.setErrors({'Invalid': true});
    if (this.direction === SwapTypeEnum.WITHDRAWAL) {
      this.addressFormGroup.setErrors({'Invalid': true});
    }
  }

  onFormValueChanges() {
    this.inputFormGroup.valueChanges.pipe(takeUntil(this.unSubs[4])).subscribe(changedValues => {
      this.inputFormGroup.setErrors({'Invalid': true});
    });
    if (this.direction === SwapTypeEnum.WITHDRAWAL) {
      this.addressFormGroup.valueChanges.pipe(takeUntil(this.unSubs[5])).subscribe(changedValues => {
        this.addressFormGroup.setErrors({'Invalid': true});
      });
    }
  }

  onSwapProviderChange(event: any) {
    switch(event.value) {
      case SwapProviderEnum.LIGHTNING_LABS:
        this.swapProvider = SwapProviderEnum.LIGHTNING_LABS;
        break;
      default:
        this.swapProvider = SwapProviderEnum.BOLTZ;
        break;
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

  onSwap() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.minQuote.amount || this.inputFormGroup.controls.amount.value > this.maxQuote.amount || !this.inputFormGroup.controls.sweepConfTarget.value || this.inputFormGroup.controls.sweepConfTarget.value < 2 || (!this.inputFormGroup.controls.routingFeePercent.value || this.inputFormGroup.controls.routingFeePercent.value < 0 || this.inputFormGroup.controls.routingFeePercent.value > this.maxRoutingFeePercentage) || (this.direction === SwapTypeEnum.LOOP_OUT && this.addressFormGroup.controls.addressType.value === 'external' && (!this.addressFormGroup.controls.address.value || this.addressFormGroup.controls.address.value.trim() === ''))) { return true; }
    this.flgEditable = false;
    this.stepper.selected.stepControl.setErrors(null);
    this.stepper.next();
    if(this.swapProvider === SwapProviderEnum.BOLTZ) {
      this.onSwapByBoltz();
    } else if (this.swapProvider === SwapProviderEnum.LIGHTNING_LABS) {
      this.onSwapByLightningLabs();
    }
  }

  onSwapByBoltz() {
    const swapInfo = this.boltzService.getSwapInfo();
    if(this.direction === SwapTypeEnum.DEPOSIT) {
      this.store.dispatch(new LNDActions.SaveNewInvoice({
        memo: 'Sent to BTC Lightning',
        invoiceValue: this.inputFormGroup.controls.amount.value, 
        expiry: 3600, 
        private: false,
        pageSize: 10,
        openModal: false
      }));
      this.actions$.pipe(takeUntil(this.unSubs[1]),
      filter((action) => action.type === LNDActions.NEWLY_SAVED_INVOICE_LND))
      .subscribe((action: LNDActions.NewlySavedInvoice) => {
        this.boltzService.onSwap({
          direction: this.direction,
          invoiceAmount: this.inputFormGroup.controls.amount.value,
          swapInfo,
          paymentRequest: action.payload.paymentRequest
        }).subscribe((swapStatus: any) => {
          this.saveSwapFile({
            swapStatus,
            costServer: this.quote.swap_fee,
            costOnchain: this.quote.miner_fee,
            swapInfo,
          });
          this.loopStatus = {
            id_bytes: swapStatus.id,
            htlc_address: swapStatus.address
          };
          this.store.dispatch(new LNDActions.FetchBoltzSwaps());

          const paymentBody = {
            address: swapStatus.address,
            amount: swapStatus.expectedAmount
          };
          this.store.dispatch(new LNDActions.SetChannelTransaction(paymentBody));
        })
      });
    } else {
      this.store.dispatch(new LNDActions.GetNewAddress(this.selectedAddressType));
      this.lndEffects.setNewAddress
      .pipe(take(1))
      .subscribe(newAddress => {
        this.boltzService.onSwap({
          direction: this.direction,
          invoiceAmount: this.inputFormGroup.controls.amount.value,
          swapInfo,
          paymentRequest: null
        }).subscribe((swapStatus: any) => {
          this.saveSwapFile({
            swapStatus,
            costServer: this.quote.swap_fee,
            costOnchain: this.quote.miner_fee,
            swapInfo: {...swapInfo, newAddress},
          });
          this.loopStatus = {
            id_bytes: swapStatus.id,
            htlc_address: swapStatus.lockupAddress
          };
          this.flgEditable = true;
          this.store.dispatch(new LNDActions.FetchBoltzSwaps());
            
          const paymentBody = {
            fromDialog: true,
            paymentReq: swapStatus.invoice,
            paymentDecoded: {},
            zeroAmtInvoice: false,
            allowSelfPayment: true
          }
          if(this.channel && this.channel.chan_id) {
            paymentBody['outgoingChannel'] = this.channel;
          }
          this.store.dispatch(new LNDActions.SendPayment(paymentBody));
          this.actions$.pipe(takeUntil(this.unSubs[5]),
          filter((action) => action.type === LNDActions.SEND_PAYMENT_STATUS_LND))
          .subscribe((action: LNDActions.SendPaymentStatus) => {
            const error = action.payload.error;
            if(error && error.error !== 'payment is in transition') {
              this.loopStatus = { error: error.error };
            }
          });
        }, (err) => {
          this.loopStatus = { error: err.error.error ? err.error.error : err.error ? err.error : err };
          this.flgEditable = true;
          this.logger.error(err);
        })
      });
    }
  }

  saveSwapFile({swapStatus, costServer, costOnchain, swapInfo}) {
    this.store.dispatch(new LNDActions.AddBoltzSwap({
      swap: {
        ...swapStatus,
        ...swapInfo,
        costServer,
        costOnchain,
        currency: 'BTC',
        type: this.direction,
        state: SwapStateEnum.INITIATED,
        provider: SwapProviderEnum.BOLTZ,
      }
    }));
  }

  onSwapByLightningLabs() {
    if (this.direction === SwapTypeEnum.DEPOSIT) {
      this.loopService.loopIn(this.inputFormGroup.controls.amount.value, +this.quote.swap_fee_sat, +this.quote.htlc_publish_fee_sat, '', true).pipe(takeUntil(this.unSubs[0]))
      .subscribe((loopStatus: any) => {
        this.loopStatus = JSON.parse(loopStatus);
        this.store.dispatch(new LNDActions.FetchLoopSwaps());
        this.flgEditable = true;
      }, (err) => {
        this.loopStatus = { error: err.error.error ? err.error.error : err.error ? err.error : err };
        this.flgEditable = true;
        this.logger.error(err);
      });
    } else {
      let swapRoutingFee = this.inputFormGroup.controls.amount.value * (this.inputFormGroup.controls.routingFeePercent.value / 100);
      let destAddress = this.addressFormGroup.controls.addressType.value === 'external' ? this.addressFormGroup.controls.address.value : '';
      let swapPublicationDeadline = this.inputFormGroup.controls.fast.value ? 0 : new Date().getTime() + (30 * 60000);
      this.loopService.loopOut(this.inputFormGroup.controls.amount.value, (this.channel && this.channel.chan_id ? this.channel.chan_id : ''), this.inputFormGroup.controls.sweepConfTarget.value, swapRoutingFee, +this.quote.htlc_sweep_fee_sat, this.prepayRoutingFee, +this.quote.prepay_amt_sat, +this.quote.swap_fee_sat, swapPublicationDeadline, destAddress).pipe(takeUntil(this.unSubs[1]))
      .subscribe((loopStatus: any) => {
        this.loopStatus = JSON.parse(loopStatus);
        this.store.dispatch(new LNDActions.FetchLoopSwaps());
        this.flgEditable = true;
      }, (err) => {
        this.loopStatus = { error: err.error.error ? err.error.error : err.error ? err.error : err };
        this.flgEditable = true;
        this.logger.error(err);
      });
    }
  }

  onChooseProvider() {
    if(this.swapProvider === SwapProviderEnum.LIGHTNING_LABS) {
      this.getTermsAndQuotes();
    } else {
      this.getPairs();
    }
    this.nextStep();
  }

  nextStep() {
    this.stepper.selected.stepControl.setErrors(null);
    this.stepper.next();
  }

  getTermsAndQuotes () {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Terms & Quotes...'));
    if(this.direction === SwapTypeEnum.WITHDRAWAL) {
      this.loopService.getLoopOutTermsAndQuotes(this.targetConf)
      .pipe(takeUntil(this.unSubs[0]))
      .subscribe(response => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.minQuote = response[0];
        this.maxQuote = response[1];
      })
    } else {
      this.loopService.getLoopInTermsAndQuotes(this.targetConf)
      .pipe(takeUntil(this.unSubs[1]))
      .subscribe(response => {
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.minQuote = response[0];
        this.maxQuote = response[1];
      })
    }
  }

  getPairs() {
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Pairs...'));
    this.providerFormLabel = 'Choose Lightning Service Provider: Boltz.exchange';
    this.boltzService.getPairs()
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe(response => {
      const pairs = response['pairs']["BTC/BTC"];
      const lndNode = this.boltzService.getLNDNode();
      this.store.dispatch(new RTLActions.CloseSpinner());
      this.minQuote = {
        swap_fee: (pairs.limits.minimal * pairs.fees.percentage * 0.01).toString(),
        miner_fee: pairs.fees.minerFees.baseAsset.normal.toString(),
        swap_payment_dest: lndNode,
        amount: pairs.limits.minimal
      };
      this.maxQuote = {
        swap_fee: (pairs.limits.maximal * pairs.fees.percentage * 0.01).toString(),
        miner_fee: pairs.fees.minerFees.baseAsset.normal.toString(),
        swap_payment_dest: lndNode,
        amount: pairs.limits.maximal
      };
    })
  }

  onEstimateQuote() {
    if(!this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.amount.value < this.minQuote.amount || this.inputFormGroup.controls.amount.value > this.maxQuote.amount || !this.inputFormGroup.controls.sweepConfTarget.value || this.inputFormGroup.controls.sweepConfTarget.value < 2) { return true; }
    this.stepper.selected.stepControl.setErrors(null);
    this.stepper.next();
    this.store.dispatch(new RTLActions.OpenSpinner('Getting Quotes...'));
    let swapPublicationDeadline = this.inputFormGroup.controls.fast.value ? 0 : new Date().getTime() + (30 * 60000);
    if(this.swapProvider === SwapProviderEnum.BOLTZ) {
      this.boltzService.getPairs()
      .pipe(takeUntil(this.unSubs[0]))
      .subscribe(response => {
        const pairs = response['pairs']["BTC/BTC"];
        const lndNode = this.boltzService.getLNDNode();
        this.store.dispatch(new RTLActions.CloseSpinner());
        this.quote = {
          swap_fee: (this.inputFormGroup.controls.amount.value * pairs.fees.percentage * 0.01).toString(),
          miner_fee: pairs.fees.minerFees.baseAsset.normal.toString(),
          swap_payment_dest: lndNode,
          amount: this.inputFormGroup.controls.amount.value
        }
      })
    } else {
      if(this.direction === SwapTypeEnum.DEPOSIT) {
        this.loopService.getLoopInQuote(this.inputFormGroup.controls.amount.value, this.inputFormGroup.controls.sweepConfTarget.value, swapPublicationDeadline)
        .pipe(takeUntil(this.unSubs[2]))
        .subscribe(response => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.quote = response;
          this.quote.off_chain_swap_routing_fee_percentage = this.inputFormGroup.controls.routingFeePercent.value ? this.inputFormGroup.controls.routingFeePercent.value : 2;
        });
      } else {
        this.loopService.getLoopOutQuote(this.inputFormGroup.controls.amount.value, this.inputFormGroup.controls.sweepConfTarget.value, swapPublicationDeadline)
        .pipe(takeUntil(this.unSubs[3]))
        .subscribe(response => {
          this.store.dispatch(new RTLActions.CloseSpinner());
          this.quote = response;
          this.quote.off_chain_swap_routing_fee_percentage = this.inputFormGroup.controls.routingFeePercent.value ? this.inputFormGroup.controls.routingFeePercent.value : 2;
        });
      }
    }
  }

  stepSelectionChanged(event: any) {
    switch (event.selectedIndex) {
      case 1:
        this.inputFormLabel = 'Amount to ' + this.loopDirectionCaption;
        this.quoteFormLabel = 'Confirm Quote';
        this.addressFormLabel = 'Withdrawal Address';
        break;
    
      case 2:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.sweepConfTarget.value) {
          if (this.direction === SwapTypeEnum.DEPOSIT) {
            this.inputFormLabel = this.loopDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6);
          } else {
            this.inputFormLabel = this.loopDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6) + ' | Percentage: ' +  (this.inputFormGroup.controls.routingFeePercent.value ? this.inputFormGroup.controls.routingFeePercent.value : '2') + ' | Fast: ' + (this.inputFormGroup.controls.fast.value ? 'Enabled' : 'Disabled');
          }
        } else {
          this.inputFormLabel = 'Amount to ' + this.loopDirectionCaption;
        }
        this.quoteFormLabel = 'Confirm Quote';
        this.addressFormLabel = 'Withdrawal Address';
        break;

      case 3:
      case 4:
        if (this.inputFormGroup.controls.amount.value || this.inputFormGroup.controls.sweepConfTarget.value) {
          if (this.direction === SwapTypeEnum.DEPOSIT) {
            this.inputFormLabel = this.loopDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6);
          } else {
            this.inputFormLabel = this.loopDirectionCaption + ' Amount: ' + (this.decimalPipe.transform(this.inputFormGroup.controls.amount.value ? this.inputFormGroup.controls.amount.value : 0)) + ' Sats | Target Confirmation: ' + (this.inputFormGroup.controls.sweepConfTarget.value ? this.inputFormGroup.controls.sweepConfTarget.value : 6) + ' | Fast: ' + (this.inputFormGroup.controls.fast.value ? 'Enabled' : 'Disabled');
          }
        } else {
          this.inputFormLabel = 'Amount to ' + this.loopDirectionCaption;
        }
        if (this.quote && this.quote.swap_fee && this.quote.miner_fee && this.quote.prepay_amt) {
          this.quoteFormLabel = 'Quote confirmed | Estimated Fees: ' + this.decimalPipe.transform(+this.quote.swap_fee + +this.quote.miner_fee) + ' Sats' + (this.swapProvider === SwapProviderEnum.BOLTZ ? refundFileDownloadLabel : '');
        if (this.quote && this.quote.swap_fee_sat && (this.quote.htlc_sweep_fee_sat || this.quote.htlc_publish_fee_sat) && this.quote.prepay_amt_sat) {
          const refundFileDownloadLabel = ' | Refund file Download: ' + (this.quoteFormGroup.controls.downloadRefundFile.value ? 'True' : 'False');
          this.quoteFormLabel = 'Quote confirmed | Estimated Fees: ' + this.decimalPipe.transform(+this.quote.swap_fee_sat + +(this.quote.htlc_sweep_fee_sat ? this.quote.htlc_sweep_fee_sat : this.quote.htlc_publish_fee_sat ? this.quote.htlc_publish_fee_sat : 0)) + ' Sats';
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
        this.inputFormLabel = 'Amount to ' + this.loopDirectionCaption;
        this.quoteFormLabel = 'Confirm Quote';
        this.addressFormLabel = 'Withdrawal Address';        
        break;
    }
    if ((this.direction === SwapTypeEnum.WITHDRAWAL && event.selectedIndex !== 1 && event.selectedIndex < event.previouslySelectedIndex)
    || (this.direction === SwapTypeEnum.DEPOSIT && event.selectedIndex < event.previouslySelectedIndex)) {
      event.selectedStep.stepControl.setErrors({'Invalid': true});
    }
  }

  goToLoop() {
    this.dialogRef.close(true);
    this.router.navigateByUrl('/lnd/loop');
  }

  onClose() {
    this.store.dispatch(new LNDActions.FetchBoltzSwaps());
    this.dialogRef.close(true);
  }

  showInfo() {
    this.flgShowInfo = true;
  }

  onReadMore() {
    if (this.direction === SwapTypeEnum.DEPOSIT) {
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

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

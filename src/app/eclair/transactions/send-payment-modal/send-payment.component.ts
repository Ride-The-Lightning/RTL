import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { PayRequest, Channel } from '../../../shared/models/eclrModels';
import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { ECLREffects } from '../../store/eclr.effects';
import * as ECLRActions from '../../store/eclr.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-eclr-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss'],
})
export class ECLRLightningSendPaymentsComponent implements OnInit, OnDestroy {
  @ViewChild('paymentReq', { static: true }) paymentReq: NgModel;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public paymentDecoded: PayRequest = {};
  public zeroAmtInvoice = false;
  public paymentAmount = null;
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public selActiveChannel: Channel = {};
  public activeChannels = {};
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public paymentError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLRLightningSendPaymentsComponent>, private store: Store<fromRTLReducer.RTLState>, private eclrEffects: ECLREffects, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions) {}

  ngOnInit() {
    this.store.select('eclr')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.activeChannels = rtlStore.activeChannels;
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === ECLRActions.EFFECT_ERROR_ECLR || action.type === ECLRActions.SEND_PAYMENT_STATUS_ECLR))
    .subscribe((action: ECLRActions.EffectError | ECLRActions.SendPaymentStatus) => {
      if (action.type === ECLRActions.SEND_PAYMENT_STATUS_ECLR) { 
        this.dialogRef.close();
      }    
      if (action.type === ECLRActions.EFFECT_ERROR_ECLR) {
        if (action.payload.action === 'SendPayment') {
          delete this.paymentDecoded.amount;
          this.paymentError = action.payload.message;
        }
        if (action.payload.action === 'DecodePayment') {
          this.paymentDecodedHint = 'ERROR: ' + action.payload.message;
          this.paymentReq.control.setErrors({'decodeError': true});
        }
      }
    });
  }

  onSendPayment() {
    if(!this.paymentRequest) { return true; } 
    if (this.paymentDecoded.timestamp) {
      this.sendPayment();
    } else {
      this.paymentAmount = null;
      this.paymentError = '';
      this.paymentDecodedHint = '';
      this.paymentReq.control.setErrors(null);      
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new ECLRActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: true}));
      this.eclrEffects.setDecodedPayment.pipe(take(1)).subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.timestamp && !this.paymentDecoded.amount) {
          this.paymentDecoded.amount = 0;
          this.zeroAmtInvoice = true;
          this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
        } else {
          this.zeroAmtInvoice = false;
          this.commonService.convertCurrency(+this.paymentDecoded.amount, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
          .pipe(takeUntil(this.unSubs[2]))
          .subscribe(data => {
            if(this.selNode.fiatConversion) {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount/1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount/1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          });
        }
      });
    }
  }

  sendPayment() {
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
    if (this.zeroAmtInvoice) {
      this.store.dispatch(new ECLRActions.SendPayment({invoice: this.paymentRequest, amountMsat: this.paymentAmount*1000, fromDialog: true}));
    } else {
      this.store.dispatch(new ECLRActions.SendPayment({invoice: this.paymentRequest, fromDialog: true}));
    }
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentError = '';
    this.paymentDecodedHint = '';
    this.zeroAmtInvoice = false;
    if(this.paymentRequest && this.paymentRequest.length > 100) {
      this.paymentReq.control.setErrors(null);
      this.zeroAmtInvoice = false;
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new ECLRActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: true}));
      this.eclrEffects.setDecodedPayment.subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.timestamp && !this.paymentDecoded.amount) {
          this.paymentDecoded.amount = 0;
          this.zeroAmtInvoice = true;
          this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
        } else {
          this.zeroAmtInvoice = false;
          this.commonService.convertCurrency(+this.paymentDecoded.amount, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
          .pipe(takeUntil(this.unSubs[3]))
          .subscribe(data => {
            if(this.selNode.fiatConversion) {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount/1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount/1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          });
        }
      });
    }
  }

  onAmountChange(event: any) {
    delete this.paymentDecoded.amount;
    this.paymentDecoded.amount = event;
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.selActiveChannel = null;
    this.feeLimit = null;
    this.selFeeLimitType = FEE_LIMIT_TYPES[0];
    this.paymentReq.control.setErrors(null);
    this.paymentError = '';
    this.paymentDecodedHint = '';
    this.zeroAmtInvoice = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

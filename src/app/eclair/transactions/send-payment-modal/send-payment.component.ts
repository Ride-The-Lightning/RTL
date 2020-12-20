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
import { PayRequest, Channel } from '../../../shared/models/eclModels';
import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { ECLEffects } from '../../store/ecl.effects';
import * as ECLActions from '../../store/ecl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-ecl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss'],
})
export class ECLLightningSendPaymentsComponent implements OnInit, OnDestroy {
  @ViewChild('paymentReq', { static: false }) paymentReq: NgModel;
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

  constructor(public dialogRef: MatDialogRef<ECLLightningSendPaymentsComponent>, private store: Store<fromRTLReducer.RTLState>, private eclEffects: ECLEffects, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions, private dataService: DataService) {}

  ngOnInit() {
    this.store.select('ecl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.activeChannels = rtlStore.activeChannels;
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === ECLActions.EFFECT_ERROR_ECL || action.type === ECLActions.SEND_PAYMENT_STATUS_ECL))
    .subscribe((action: ECLActions.EffectError | ECLActions.SendPaymentStatus) => {
      if (action.type === ECLActions.SEND_PAYMENT_STATUS_ECL) { 
        this.dialogRef.close();
      }    
      if (action.type === ECLActions.EFFECT_ERROR_ECL) {
        if (action.payload.action === 'SendPayment') {
          delete this.paymentDecoded.amount;
          this.paymentError = action.payload.message;
        }
      }
    });
  }

  onSendPayment():boolean|void {
    if(!this.paymentRequest) { return true; } 
    if (this.paymentDecoded.timestamp) {
      this.sendPayment();
    } else {
      this.paymentAmount = null;
      this.paymentError = '';
      this.paymentDecodedHint = '';
      this.paymentReq.control.setErrors(null);      
      this.dataService.decodePayment(this.paymentRequest, true)
      .pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
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
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          });
        }
      }, err => {
        this.logger.error(err);
        this.paymentDecodedHint = 'ERROR: ' + ((err.message) ? err.message : ((typeof err === 'string') ? err : JSON.stringify(err)));
        this.paymentReq.control.setErrors({'decodeError': true});
      });
    }
  }

  sendPayment() {
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
    if (this.zeroAmtInvoice) {
      this.store.dispatch(new ECLActions.SendPayment({invoice: this.paymentRequest, amountMsat: this.paymentAmount*1000, fromDialog: true}));
    } else {
      this.store.dispatch(new ECLActions.SendPayment({invoice: this.paymentRequest, fromDialog: true}));
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
      this.dataService.decodePayment(this.paymentRequest, true)
      .pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
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
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          });
        }
      }, err => {
        this.logger.error(err);
        this.paymentDecodedHint = 'ERROR: ' + ((err.message) ? err.message : ((typeof err === 'string') ? err : JSON.stringify(err)));
        this.paymentReq.control.setErrors({'decodeError': true});
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

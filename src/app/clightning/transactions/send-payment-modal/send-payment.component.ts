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
import { PayRequest, Channel } from '../../../shared/models/clModels';
import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLEffects } from '../../store/cl.effects';
import { RTLEffects } from '../../../store/rtl.effects';
import * as CLActions from '../../store/cl.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-cl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss'],
})
export class CLLightningSendPaymentsComponent implements OnInit, OnDestroy {
  private paymentReq: NgModel;
  @ViewChild('paymentReq') set payReq(paymReq: NgModel) {if(paymReq) { this.paymentReq = paymReq; }}  
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public paymentDecoded: PayRequest = {};
  public zeroAmtInvoice = false;
  public paymentAmount = null;
  public paymentType = 'invoice';
  public pubkey = '';
  public keysendAmount = null;
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public selActiveChannel: Channel = {};
  public activeChannels = {};
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public paymentError = '';
  public isCompatibleVersion = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLLightningSendPaymentsComponent>, private store: Store<fromRTLReducer.RTLState>, private clEffects: CLEffects, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions, private rtlEffects: RTLEffects) {}

  ngOnInit() {
    this.store.select('cl')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.activeChannels = rtlStore.allChannels.filter(channel => channel.state === 'CHANNELD_NORMAL' && channel.connected);
      this.isCompatibleVersion = 
        this.commonService.isVersionCompatible(rtlStore.information.version, '0.9.0')
        && this.commonService.isVersionCompatible(rtlStore.information.api_version, '0.4.0');
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === CLActions.EFFECT_ERROR_CL || action.type === CLActions.SEND_PAYMENT_STATUS_CL))
    .subscribe((action: CLActions.EffectError | CLActions.SendPaymentStatus) => {
      if (action.type === CLActions.SEND_PAYMENT_STATUS_CL) { 
        this.dialogRef.close();
      }    
      if (action.type === CLActions.EFFECT_ERROR_CL) {
        if (action.payload.action === 'SendPayment') {
          delete this.paymentDecoded.msatoshi;
          this.paymentError = action.payload.message;
        }
        if (action.payload.action === 'DecodePayment') {
          this.paymentDecodedHint = 'ERROR: ' + action.payload.message;
          this.paymentReq.control.setErrors({'decodeError': true});
        }
      }
    });
  }

  onSendPayment():boolean|void {
    if ((this.paymentType === 'invoice' && !this.paymentRequest) || (this.paymentType === 'keysend' && (!this.pubkey || this.pubkey.trim() === '' || !this.keysendAmount || this.keysendAmount <= 0))) { return true; } 
    if (this.paymentType === 'keysend') {
      this.keysendPayment();
    } else {
      if (this.paymentDecoded.created_at_str) {
        this.sendPayment();
      } else {
        this.paymentAmount = null;
        this.paymentError = '';
        this.paymentDecodedHint = '';
        this.paymentReq.control.setErrors(null);      
        this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
        this.store.dispatch(new CLActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: true}));
        this.clEffects.setDecodedPaymentCL.pipe(take(1)).subscribe(decodedPayment => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.created_at_str && !this.paymentDecoded.msatoshi) {
            this.paymentDecoded.msatoshi = 0;
            this.zeroAmtInvoice = true;
            this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
          } else {
            this.zeroAmtInvoice = false;
            this.commonService.convertCurrency(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
            .pipe(takeUntil(this.unSubs[2]))
            .subscribe(data => {
              if(this.selNode.fiatConversion) {
                this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
              } else {
                this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
              }
            });
          }
        });
      }
    }
  }

  keysendPayment() {
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Keysend Payment...'));
    this.store.dispatch(new CLActions.SendPayment({pubkey: this.pubkey, amount: this.keysendAmount*1000, fromDialog: true}));
  }

  sendPayment() {
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
    if (this.zeroAmtInvoice) {
      this.store.dispatch(new CLActions.SendPayment({invoice: this.paymentRequest, amount: this.paymentAmount*1000, fromDialog: true}));
    } else {
      this.store.dispatch(new CLActions.SendPayment({invoice: this.paymentRequest, fromDialog: true}));
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
      this.store.dispatch(new CLActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: true}));
      this.clEffects.setDecodedPaymentCL.subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.created_at_str && !this.paymentDecoded.msatoshi) {
          this.paymentDecoded.msatoshi = 0;
          this.zeroAmtInvoice = true;
          this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
        } else {
          this.zeroAmtInvoice = false;
          this.commonService.convertCurrency(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
          .pipe(takeUntil(this.unSubs[3]))
          .subscribe(data => {
            if(this.selNode.fiatConversion) {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi/1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          });
        }
      });
    }
  }

  onAmountChange(event: any) {
    delete this.paymentDecoded.msatoshi;
    this.paymentDecoded.msatoshi = event;
  }

  onPaymentTypeChange() {
    this.paymentError = '';
  }

  resetData() {
    if (this.paymentType === 'keysend') {
      this.pubkey = '';
      this.keysendAmount = null;
    } else {
      this.paymentDecoded = {};
      this.paymentRequest = '';
      this.selActiveChannel = null;
      this.feeLimit = null;
      this.selFeeLimitType = FEE_LIMIT_TYPES[0];
      this.paymentReq.control.setErrors(null);
      this.paymentDecodedHint = '';
      this.zeroAmtInvoice = false;
      this.paymentAmount = null;
    }
    this.paymentError = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

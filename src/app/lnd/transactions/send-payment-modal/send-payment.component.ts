import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { PayRequest, Channel } from '../../../shared/models/lndModels';
import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { LNDEffects } from '../../store/lnd.effects';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss'],
})
export class LightningSendPaymentsComponent implements OnInit, OnDestroy {
  @ViewChild('paymentReq', { static: true }) paymentReq: NgModel;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public paymentDecoded: PayRequest = {};
  public zeroAmtInvoice = false;
  public paymentAmount = null;
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public showAdvanced = false;
  public selActiveChannel: Channel = {};
  public activeChannels = {};
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public advancedTitle = 'Advanced Options';
  public paymentError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LightningSendPaymentsComponent>, private store: Store<fromRTLReducer.RTLState>, private lndEffects: LNDEffects, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.activeChannels = rtlStore.allChannels.filter(channel => channel.active);
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === RTLActions.EFFECT_ERROR_LND || action.type === RTLActions.SEND_PAYMENT_STATUS))
    .subscribe((action: RTLActions.EffectErrorLnd | RTLActions.SendPaymentStatus) => {
      if (action.type === RTLActions.SEND_PAYMENT_STATUS) { 
        this.dialogRef.close();
      }    
      if (action.type === RTLActions.EFFECT_ERROR_LND) {
        if (action.payload.action === 'SendPayment') {
          delete this.paymentDecoded.num_satoshis;          
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
    if ( this.paymentDecoded.timestamp_str) {
      this.sendPayment();
    } else {
      this.paymentAmount = null;
      this.paymentError = '';
      this.paymentDecodedHint = '';
      this.paymentReq.control.setErrors(null);
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new RTLActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: true}));
      this.lndEffects.setDecodedPayment.pipe(take(1)).subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
          this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
        }
        if(this.paymentDecoded.num_satoshis && this.paymentDecoded.num_satoshis !== '' && this.paymentDecoded.num_satoshis !== '0') {
          this.zeroAmtInvoice = false;
          if(this.selNode.fiatConversion) {
            this.commonService.convertCurrency(+this.paymentDecoded.num_satoshis, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
            .pipe(takeUntil(this.unSubs[2]))
            .subscribe(data => {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
            });
          } else {
            this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis) + ' Sats | Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
          }
        } else {
          this.zeroAmtInvoice = true;
          this.paymentDecodedHint = 'Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
        }
      });
    }
  }

  sendPayment() {
    if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
      this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
    }
    this.store.dispatch(new RTLActions.OpenSpinner('Sending Payment...'));
    if (!this.paymentDecoded.num_satoshis || this.paymentDecoded.num_satoshis === '' ||  this.paymentDecoded.num_satoshis === '0') {
      this.zeroAmtInvoice = true;
      this.paymentDecoded.num_satoshis = this.paymentAmount;
      this.store.dispatch(new RTLActions.SendPayment({paymentReq: this.paymentRequest, paymentDecoded: this.paymentDecoded, zeroAmtInvoice: true, outgoingChannel: this.selActiveChannel, feeLimitType: this.selFeeLimitType, feeLimit: this.feeLimit, fromDialog: true}));
    } else {
      this.zeroAmtInvoice = false;
      this.store.dispatch(new RTLActions.SendPayment({paymentReq: this.paymentRequest, paymentDecoded: this.paymentDecoded, zeroAmtInvoice: false, outgoingChannel: this.selActiveChannel, feeLimitType: this.selFeeLimitType, feeLimit: this.feeLimit, fromDialog: true}));
    }
  }

  onAmountChange(event: any) {
    delete this.paymentDecoded.num_satoshis;
    console.warn(this.paymentDecoded);
  }

  onPasteInvoice(event: any) {
    this.paymentRequest = event.clipboardData.getData('Text');
    this.onPaymentRequestEntry();
  }

  onPaymentRequestEntry() {
    this.paymentAmount = null;
    this.paymentError = '';
    this.paymentDecodedHint = '';
    this.zeroAmtInvoice = false;
    if(this.paymentRequest.length > 100) {
      this.paymentReq.control.setErrors(null);
      this.zeroAmtInvoice = false;
      this.store.dispatch(new RTLActions.OpenSpinner('Decoding Payment...'));
      this.store.dispatch(new RTLActions.DecodePayment({routeParam: this.paymentRequest, fromDialog: true}));
      this.lndEffects.setDecodedPayment.pipe(take(1)).subscribe(decodedPayment => {
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
          this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
        }
        if(this.paymentDecoded.num_satoshis && this.paymentDecoded.num_satoshis !== '' && this.paymentDecoded.num_satoshis !== '0') {
          this.zeroAmtInvoice = false;
          if(this.selNode.fiatConversion) {
            this.commonService.convertCurrency(+this.paymentDecoded.num_satoshis, CurrencyUnitEnum.SATS, this.selNode.currencyUnits[2], this.selNode.fiatConversion)
            .pipe(takeUntil(this.unSubs[2]))
            .subscribe(data => {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
            });
          } else {
            this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.num_satoshis) + ' Sats | Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
          }
        } else {
          this.zeroAmtInvoice = true;
          this.paymentDecodedHint = 'Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
        }
      });
    }
  }

  onAdvancedPanelToggle(isClosed: boolean) {
    if (isClosed) {
      this.advancedTitle = 'Advanced Options | ' + this.selFeeLimitType.name + (this.selFeeLimitType.id === 'none' ? '' : (': ' + this.feeLimit)) + ((this.selActiveChannel.remote_alias || this.selActiveChannel.chan_id) ? ' | First Outgoing Channel: ' + (this.selActiveChannel.remote_alias ? this.selActiveChannel.remote_alias : this.selActiveChannel.chan_id) : '');
    } else {
      this.advancedTitle = 'Advanced Options';
    }
  }

  resetData() {
    this.paymentDecoded = {};
    this.paymentRequest = '';
    this.selActiveChannel = null;
    this.feeLimit = null;
    this.selFeeLimitType = FEE_LIMIT_TYPES[0];
    this.advancedTitle = 'Advanced Options';
    this.zeroAmtInvoice = false;
    this.paymentReq.control.setErrors(null);
    this.paymentError = '';
    this.paymentDecodedHint = '';
  }

  ngOnDestroy() {
    this.unSubs.forEach(completeSub => {
      completeSub.next();
      completeSub.complete();
    });
  }

}

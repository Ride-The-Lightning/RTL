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
import { PayRequest, Channel } from '../../../shared/models/lndModels';
import { CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import * as LNDActions from '../../store/lnd.actions';
import * as RTLActions from '../../../store/rtl.actions';
import * as fromRTLReducer from '../../../store/rtl.reducers';

@Component({
  selector: 'rtl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss'],
})
export class LightningSendPaymentsComponent implements OnInit, OnDestroy {
  @ViewChild('paymentReq', { static: false }) paymentReq: NgModel;
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public paymentDecoded: PayRequest = {};
  public zeroAmtInvoice = false;
  public paymentAmount = null;
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public showAdvanced = false;
  public selActiveChannel: Channel = {};
  public activeChannels = [];
  public filteredMinAmtActvChannels = [];
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public advancedTitle = 'Advanced Options';
  public paymentError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<LightningSendPaymentsComponent>, private store: Store<fromRTLReducer.RTLState>, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions$: Actions, private dataService: DataService) {}

  ngOnInit() {
    this.store.select('lnd')
    .pipe(takeUntil(this.unSubs[0]))
    .subscribe((rtlStore) => {
      this.selNode = rtlStore.nodeSettings;
      this.activeChannels = rtlStore.allChannels.filter(channel => channel.active);
      this.filteredMinAmtActvChannels = this.activeChannels;
      this.logger.info(rtlStore);
    });
    this.actions$.pipe(takeUntil(this.unSubs[1]),
    filter(action => action.type === LNDActions.EFFECT_ERROR_LND || action.type === LNDActions.SEND_PAYMENT_STATUS_LND))
    .subscribe((action: LNDActions.EffectError | LNDActions.SendPaymentStatus) => {
      if (action.type === LNDActions.SEND_PAYMENT_STATUS_LND) { 
        this.dialogRef.close();
      }    
      if (action.type === LNDActions.EFFECT_ERROR_LND) {
        if (action.payload.action === 'SendPayment') {
          delete this.paymentDecoded.num_satoshis;          
          this.paymentError = action.payload.message;
        }
      }
    });
  }

  onSendPayment():boolean|void {
    if(!this.paymentRequest) { return true; } 
    if ( this.paymentDecoded.timestamp_str) {
      this.sendPayment();
    } else {
      this.paymentAmount = null;
      this.paymentError = '';
      this.paymentDecodedHint = '';
      this.paymentReq.control.setErrors(null);
      this.dataService.decodePayment(this.paymentRequest, true)
      .pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
        this.selActiveChannel = {};
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
          this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
        }
        if(this.paymentDecoded.num_satoshis && this.paymentDecoded.num_satoshis !== '' && this.paymentDecoded.num_satoshis !== '0') {
          this.zeroAmtInvoice = false;
          this.filteredMinAmtActvChannels = this.activeChannels.filter(actvChannel => actvChannel.local_balance >= this.paymentDecoded.num_satoshis);
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
          this.filteredMinAmtActvChannels = this.activeChannels;
          this.paymentDecodedHint = 'Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
        }
      }, err => {
        this.logger.error(err);
        this.paymentDecodedHint = 'ERROR: ' + err.message;
        this.paymentReq.control.setErrors({'decodeError': true});
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
      this.store.dispatch(new LNDActions.SendPayment({paymentReq: this.paymentRequest, paymentAmount:this.paymentAmount, outgoingChannel: this.selActiveChannel, feeLimitType: this.selFeeLimitType, feeLimit: this.feeLimit, fromDialog: true}));
    } else {
      this.zeroAmtInvoice = false;
      this.store.dispatch(new LNDActions.SendPayment({paymentReq: this.paymentRequest, outgoingChannel: this.selActiveChannel, feeLimitType: this.selFeeLimitType, feeLimit: this.feeLimit, fromDialog: true}));
    }
  }

  onAmountChange(event: any) {
    delete this.paymentDecoded.num_satoshis;
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentAmount = null;
    this.paymentError = '';
    this.paymentDecodedHint = '';
    this.zeroAmtInvoice = false;
    if(this.paymentRequest && this.paymentRequest.length > 100) {
      this.paymentReq.control.setErrors(null);
      this.zeroAmtInvoice = false;
      this.dataService.decodePayment(this.paymentRequest, true)
      .pipe(take(1)).subscribe((decodedPayment: PayRequest) => {
        this.paymentDecoded = decodedPayment;
        this.selActiveChannel = {};
        if (this.paymentDecoded.num_msat && !this.paymentDecoded.num_satoshis) {
          this.paymentDecoded.num_satoshis = (+this.paymentDecoded.num_msat / 1000).toString();
        }
        if(this.paymentDecoded.num_satoshis && this.paymentDecoded.num_satoshis !== '' && this.paymentDecoded.num_satoshis !== '0') {
          this.zeroAmtInvoice = false;
          this.filteredMinAmtActvChannels = this.activeChannels.filter(actvChannel => actvChannel.local_balance >= this.paymentDecoded.num_satoshis);
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
          this.filteredMinAmtActvChannels = this.activeChannels;
          this.paymentDecodedHint = 'Memo: ' + (this.paymentDecoded.description ? this.paymentDecoded.description : 'None');
        }
      }, err => {
        this.logger.error(err);
        this.paymentDecodedHint = 'ERROR: ' + err.message;
        this.paymentReq.control.setErrors({'decodeError': true});
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
    this.filteredMinAmtActvChannels = this.activeChannels;
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

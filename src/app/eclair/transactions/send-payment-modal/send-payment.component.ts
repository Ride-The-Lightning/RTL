import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgModel } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { Node } from '../../../shared/models/RTLconfig';
import { PayRequest, Channel, LightningBalance, ChannelsStatus } from '../../../shared/models/eclModels';
import { APICallStatusEnum, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, ECLActions, FEE_LIMIT_TYPES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { DataService } from '../../../shared/services/data.service';

import { ECLEffects } from '../../store/ecl.effects';
import { RTLState } from '../../../store/rtl.state';
import { sendPayment } from '../../store/ecl.actions';
import { allChannelsInfo, eclNodeSettings } from '../../store/ecl.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { ConvertedCurrency } from '../../../shared/models/rtlModels';

@Component({
  selector: 'rtl-ecl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss']
})
export class ECLLightningSendPaymentsComponent implements OnInit, OnDestroy {

  @ViewChild('paymentReq', { static: false }) paymentReq: NgModel;
  public faExclamationTriangle = faExclamationTriangle;
  public convertedCurrency: ConvertedCurrency = null;
  public selNode: Node | null;
  public paymentDecoded: PayRequest = {};
  public zeroAmtInvoice = false;
  public paymentAmount = null;
  public paymentRequest = '';
  public paymentDecodedHintPre = '';
  public paymentDecodedHintPost = '';
  public selActiveChannel: Channel | null = {};
  public activeChannels = {};
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public paymentError = '';
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<ECLLightningSendPaymentsComponent>, private store: Store<RTLState>, private eclEffects: ECLEffects, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions: Actions, private dataService: DataService) { }

  ngOnInit() {
    this.store.select(eclNodeSettings).pipe(takeUntil(this.unSubs[0])).
      subscribe((nodeSettings: Node | null) => {
        this.selNode = nodeSettings;
      });
    this.store.select(allChannelsInfo).pipe(takeUntil(this.unSubs[1])).
      subscribe((allChannelsSelector: ({ activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], lightningBalance: LightningBalance, channelsStatus: ChannelsStatus, apiCallStatus: ApiCallStatusPayload })) => {
        this.activeChannels = allChannelsSelector.activeChannels;
        this.logger.info(allChannelsSelector);
      });
    this.actions.pipe(
      takeUntil(this.unSubs[1]),
      filter((action) => action.type === ECLActions.UPDATE_API_CALL_STATUS_ECL || action.type === ECLActions.SEND_PAYMENT_STATUS_ECL)).
      subscribe((action: any) => {
        if (action.type === ECLActions.SEND_PAYMENT_STATUS_ECL) {
          this.dialogRef.close();
        }
        if (action.type === ECLActions.UPDATE_API_CALL_STATUS_ECL && action.payload.status === APICallStatusEnum.ERROR && action.payload.action === 'SendPayment') {
          delete this.paymentDecoded.amount;
          this.paymentError = action.payload.message;
        }
      });
  }

  onSendPayment(): boolean | void {
    if (!this.paymentRequest) {
      return true;
    }
    if (this.paymentDecoded.timestamp) {
      this.sendPayment();
    } else {
      this.paymentAmount = null;
      this.paymentError = '';
      this.paymentDecodedHintPre = '';
      this.paymentDecodedHintPost = '';
      this.paymentReq.control.setErrors(null);
      this.dataService.decodePayment(this.paymentRequest, true).
        pipe(take(1)).subscribe({
          next: (decodedPayment: PayRequest) => {
            this.paymentDecoded = decodedPayment;
            if (this.paymentDecoded.timestamp && !this.paymentDecoded.amount) {
              this.paymentDecoded.amount = 0;
              this.zeroAmtInvoice = true;
              this.paymentDecodedHintPre = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
              this.paymentDecodedHintPost = '';
            } else {
              this.zeroAmtInvoice = false;
              if (this.selNode && this.selNode.settings.fiatConversion && this.paymentDecoded.amount) {
                this.commonService.convertCurrency(+this.paymentDecoded.amount, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.settings.currencyUnits && this.selNode.settings.currencyUnits.length > 2 ? this.selNode.settings.currencyUnits[2] : ''), this.selNode.settings.fiatConversion).
                  pipe(takeUntil(this.unSubs[2])).
                  subscribe({
                    next: (data) => {
                      this.convertedCurrency = data;
                      this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats (';
                      this.paymentDecodedHintPost = this.decimalPipe.transform((this.convertedCurrency.OTHER ? this.convertedCurrency.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
                    }, error: (error) => {
                      this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount / 1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                      this.paymentDecodedHintPost = '';
                    }
                  });
              } else {
                this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
                this.paymentDecodedHintPost = '';
              }
            }
          }, error: (err) => {
            this.logger.error(err);
            this.paymentDecodedHintPre = 'ERROR: ' + ((err.message) ? err.message : ((typeof err === 'string') ? err : JSON.stringify(err)));
            this.paymentDecodedHintPost = '';
            this.paymentReq.control.setErrors({ decodeError: true });
          }
        });
    }
  }

  sendPayment() {
    if (this.zeroAmtInvoice && this.paymentAmount) {
      this.store.dispatch(sendPayment({ payload: { invoice: this.paymentRequest, amountMsat: this.paymentAmount * 1000, fromDialog: true } }));
    } else {
      this.store.dispatch(sendPayment({ payload: { invoice: this.paymentRequest, fromDialog: true } }));
    }
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event && typeof event === 'string' ? event.trim() : event;
    this.paymentError = '';
    this.paymentDecodedHintPre = '';
    this.paymentDecodedHintPost = '';
    this.zeroAmtInvoice = false;
    if (this.paymentRequest && this.paymentRequest.length > 100) {
      this.paymentReq.control.setErrors(null);
      this.zeroAmtInvoice = false;
      this.dataService.decodePayment(this.paymentRequest, true).
        pipe(take(1)).subscribe({
          next: (decodedPayment: PayRequest) => {
            this.paymentDecoded = decodedPayment;
            if (this.paymentDecoded.timestamp && !this.paymentDecoded.amount) {
              this.paymentDecoded.amount = 0;
              this.zeroAmtInvoice = true;
              this.paymentDecodedHintPre = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
              this.paymentDecodedHintPost = '';
            } else {
              this.zeroAmtInvoice = false;
              if (this.selNode && this.selNode.settings.fiatConversion && this.paymentDecoded.amount) {
                this.commonService.convertCurrency(+this.paymentDecoded.amount, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, (this.selNode.settings.currencyUnits && this.selNode.settings.currencyUnits.length > 2 ? this.selNode.settings.currencyUnits[2] : ''), this.selNode.settings.fiatConversion).
                  pipe(takeUntil(this.unSubs[3])).
                  subscribe({
                    next: (data1) => {
                      this.convertedCurrency = data1;
                      this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats (';
                      this.paymentDecodedHintPost = this.decimalPipe.transform((this.convertedCurrency.OTHER ? this.convertedCurrency.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
                    }, error: (error) => {
                      this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                      this.paymentDecodedHintPost = '';
                    }
                  });
              } else {
                this.paymentDecodedHintPre = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.amount ? this.paymentDecoded.amount : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
                this.paymentDecodedHintPost = '';
              }
            }
          }, error: (err) => {
            this.logger.error(err);
            this.paymentDecodedHintPre = 'ERROR: ' + ((err.message) ? err.message : ((typeof err === 'string') ? err : JSON.stringify(err)));
            this.paymentDecodedHintPost = '';
            this.paymentReq.control.setErrors({ decodeError: true });
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
    this.paymentDecodedHintPre = '';
    this.paymentDecodedHintPost = '';
    this.zeroAmtInvoice = false;
  }

  ngOnDestroy() {
    this.unSubs.forEach((completeSub) => {
      completeSub.next(<any>null);
      completeSub.complete();
    });
  }

}

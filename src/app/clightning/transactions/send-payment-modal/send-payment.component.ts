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
import { PayRequest, Channel, GetInfo, OfferRequest } from '../../../shared/models/clModels';
import { APICallStatusEnum, CLActions, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { CLEffects } from '../../store/cl.effects';
import { RTLState } from '../../../store/rtl.state';
import { decodeOfferPayment, decodePayment, fetchOfferInvoice, sendPayment } from '../../store/cl.actions';
import { channels, clNodeInformation, clNodeSettings } from '../../store/cl.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';

@Component({
  selector: 'rtl-cl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss']
})
export class CLLightningSendPaymentsComponent implements OnInit, OnDestroy {

  private paymentReq: NgModel;
  @ViewChild('paymentReq') set payReq(paymReq: NgModel) {
    if (paymReq) {
      this.paymentReq = paymReq;
    }
  }
  public faExclamationTriangle = faExclamationTriangle;
  public selNode: SelNodeChild = {};
  public paymentDecoded: PayRequest = {};
  public offerDecoded: OfferRequest;
  public zeroAmtInvoice = false;
  public paymentAmount = null;
  public paymentType = 'invoice';
  public offerError = '';
  public offerDecodedHint = '';
  public offerMsatoshis = '';
  public pubkey = '';
  public offerInvoice = '';
  public offerString = '';
  public keysendAmount = null;
  public paymentRequest = '';
  public offerRequest = '';
  public noAmountOffer = false;
  public paymentDecodedHint = '';
  public selActiveChannel: Channel = {};
  public activeChannels = {};
  public panelOpenState = true;
  public feeLimit = null;
  public offerAmount = null;
  public timeUnit = null;
  public period = null;
  public recurrenceCounterNeeded = false;
  public recurrenceCounter = null;
  public recurrenceLabel = '';
  public recurrentPayment = false;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public paymentError = '';
  public isCompatibleVersion = false;
  public timeUnitConvertor: string[] = ['seconds', 'minutes', 'hours', 'days', 'weeks'];
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLLightningSendPaymentsComponent>, private store: Store<RTLState>, private clEffects: CLEffects, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions: Actions) { }

  ngOnInit() {
    this.store.select(clNodeSettings).pipe(takeUntil(this.unSubs[0])).subscribe((nodeSettings: SelNodeChild) => {
      this.selNode = nodeSettings;
    });
    this.store.select(clNodeInformation).pipe(takeUntil(this.unSubs[1])).subscribe((nodeInfo: GetInfo) => {
      this.isCompatibleVersion =
        this.commonService.isVersionCompatible(nodeInfo.version, '0.9.0') &&
        this.commonService.isVersionCompatible(nodeInfo.api_version, '0.4.0');
    });
    this.store.select(channels).pipe(takeUntil(this.unSubs[2])).
      subscribe((channelsSeletor: { activeChannels: Channel[], pendingChannels: Channel[], inactiveChannels: Channel[], apiCallStatus: ApiCallStatusPayload }) => {
        this.activeChannels = channelsSeletor.activeChannels;
        this.logger.info(channelsSeletor);
      });
    this.actions.pipe(
      takeUntil(this.unSubs[3]),
      filter((action) => action.type === CLActions.UPDATE_API_CALL_STATUS_CL || action.type === CLActions.SEND_PAYMENT_STATUS_CL)).
      subscribe((action: any) => {
        if (action.type === CLActions.SEND_PAYMENT_STATUS_CL) {
          this.dialogRef.close();
        }
        if (action.type === CLActions.UPDATE_API_CALL_STATUS_CL && action.payload.status === APICallStatusEnum.ERROR) {
          if (action.payload.action === 'SendPayment') {
            delete this.paymentDecoded.msatoshi;
            this.paymentError = action.payload.message;
          }
          if (action.payload.action === 'DecodePayment') {
            this.paymentDecodedHint = 'ERROR: ' + action.payload.message;
            this.paymentReq.control.setErrors({ decodeError: true });
          }
        }
      });
  }

  onSendPayment(): boolean | void {
    if ((this.paymentType === 'invoice' && !this.paymentRequest) || (this.paymentType === 'keysend' && (!this.pubkey || this.pubkey.trim() === '' || !this.keysendAmount || this.keysendAmount <= 0))) {
      return true;
    }
    if (this.paymentType === 'keysend') {
      this.keysendPayment();
    } else if (this.paymentType === 'offer') {
      this.sendOfferPayment();
    } else {
      if (this.paymentDecoded.created_at) {
        this.sendPayment();
      } else {
        this.paymentAmount = null;
        this.paymentError = '';
        this.paymentDecodedHint = '';
        this.paymentReq.control.setErrors(null);
        this.store.dispatch(decodePayment({ payload: { routeParam: this.paymentRequest, fromDialog: true } }));
        this.clEffects.setDecodedPaymentCL.pipe(take(1)).subscribe((decodedPayment) => {
          this.paymentDecoded = decodedPayment;
          if (this.paymentDecoded.created_at && !this.paymentDecoded.msatoshi) {
            this.paymentDecoded.msatoshi = 0;
            this.zeroAmtInvoice = true;
            this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
          } else {
            this.zeroAmtInvoice = false;
            if (this.selNode.fiatConversion) {
              this.commonService.convertCurrency(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
                pipe(takeUntil(this.unSubs[4])).
                subscribe({
                  next: (data) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
                  }, error: (error) => {
                    this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                  }
                });
            } else {
              this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
            }
          }
        });
      }
    }
  }

  keysendPayment() {
    this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_KEYSEND, pubkey: this.pubkey, amount: this.keysendAmount * 1000, fromDialog: true } }));
  }

  sendPayment() {
    if (this.zeroAmtInvoice) {
      this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, invoice: this.paymentRequest, amount: this.paymentAmount * 1000, fromDialog: true } }));
    } else {
      this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, invoice: this.paymentRequest, fromDialog: true } }));
    }
  }

  sendOfferPayment() {
    this.store.dispatch(fetchOfferInvoice({ payload: { offer: this.offerRequest, msatoshi: this.offerAmount + 'msats', recurrence_counter: this.recurrenceCounter, recurrence_label: this.recurrenceLabel } }));
    this.clEffects.setOfferInvoiceCL.subscribe((fetchedInvoice) => {
      if (this.zeroAmtInvoice) {
        this.store.dispatch(sendPayment({ payload: { label: this.recurrenceLabel, uiMessage: UI_MESSAGES.SEND_PAYMENT, invoice: fetchedInvoice.invoice, amount: this.paymentAmount * 1000, fromDialog: true } }));
      } else {
        this.store.dispatch(sendPayment({ payload: { label: this.recurrenceLabel, uiMessage: UI_MESSAGES.SEND_PAYMENT, invoice: fetchedInvoice.invoice, fromDialog: true } }));
      }
    });
  }

  onPaymentRequestEntry(event: any) {
    this.paymentRequest = event;
    this.paymentError = '';
    this.paymentDecodedHint = '';
    this.zeroAmtInvoice = false;
    if (this.paymentRequest && this.paymentRequest.length > 100) {
      this.paymentReq.control.setErrors(null);
      this.zeroAmtInvoice = false;
      this.store.dispatch(decodePayment({ payload: { routeParam: this.paymentRequest, fromDialog: true } }));
      this.clEffects.setDecodedPaymentCL.subscribe((decodedPayment) => {
        this.paymentDecoded = decodedPayment;
        if (this.paymentDecoded.created_at && !this.paymentDecoded.msatoshi) {
          this.paymentDecoded.msatoshi = 0;
          this.zeroAmtInvoice = true;
          this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
        } else {
          this.zeroAmtInvoice = false;
          if (this.selNode.fiatConversion) {
            this.commonService.convertCurrency(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
              pipe(takeUntil(this.unSubs[5])).
              subscribe({
                next: (data) => {
                  this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.paymentDecoded.description;
                }, error: (error) => {
                  this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description + '. Unable to convert currency.';
                }
              });
          } else {
            this.paymentDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0) + ' Sats | Memo: ' + this.paymentDecoded.description;
          }
        }
      });
    }
  }

  onPaymentOfferEntry(event: any) {
    this.offerRequest = event;
    this.offerDecodedHint = '';
    this.zeroAmtInvoice = false;
    if (this.offerRequest) {
      this.store.dispatch(decodeOfferPayment({ payload: { routeParam: this.offerRequest, fromDialog: true } }));
      this.clEffects.setDecodedOfferCL.subscribe((decodedOffer) => {
        this.offerDecoded = decodedOffer;
        if (this.offerDecoded.recurrence) {
          this.panelOpenState = true;
          this.recurrentPayment = true;
          this.timeUnit = this.timeUnitConvertor[this.offerDecoded.recurrence.time_unit];
          this.period = this.offerDecoded.recurrence.period;
          this.recurrenceCounterNeeded = true;
        } else {
          this.recurrentPayment = false;
        }
        if (this.offerDecoded.amount_msat) {
          this.noAmountOffer = false;
          const msat = (this.offerDecoded.amount_msat).split('m')[0];
          this.offerAmount = parseInt(msat);
          if (this.offerAmount) {
            this.zeroAmtInvoice = false;
            if (this.selNode.fiatConversion) {
              this.commonService.convertCurrency(this.offerAmount ? this.offerAmount / 1000 : 0, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
                pipe(takeUntil(this.unSubs[3])).
                subscribe({
                  next: (data) => {
                    this.offerDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.offerAmount ? this.offerAmount / 1000 : 0) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Memo: ' + this.offerDecoded.description;
                  }, error: (error) => {
                    this.offerDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.offerAmount ? this.offerAmount / 1000 : 0) + ' Sats | Memo: ' + this.offerDecoded.description + '. Unable to convert currency.';
                  }
                });
            } else {
              this.offerDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.offerAmount ? this.offerAmount / 1000 : 0) + ' Sats | Memo: ' + this.offerDecoded.description;
            }
          } else {
            this.zeroAmtInvoice = true;
            this.offerDecodedHint = 'Zero Amount Invoice | Memo: ' + this.offerDecoded.description;
          }
        } else {
          this.noAmountOffer = true;
          this.offerAmount = null;
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
    this.unSubs.forEach((completeSub) => {
      completeSub.next(null);
      completeSub.complete();
    });
  }

}

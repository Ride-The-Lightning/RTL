import { Component, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { Actions } from '@ngrx/effects';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import { SelNodeChild } from '../../../shared/models/RTLconfig';
import { PayRequest, Channel, GetInfo, OfferRequest, OfferInvoice } from '../../../shared/models/clModels';
import { APICallStatusEnum, CLActions, PaymentTypes, CurrencyUnitEnum, CURRENCY_UNIT_FORMATS, FEE_LIMIT_TYPES, UI_MESSAGES } from '../../../shared/services/consts-enums-functions';
import { CommonService } from '../../../shared/services/common.service';
import { LoggerService } from '../../../shared/services/logger.service';

import { RTLState } from '../../../store/rtl.state';
import { decodePayment, fetchOfferInvoice, sendPayment } from '../../store/cl.actions';
import { channels, clNodeInformation, clNodeSettings } from '../../store/cl.selector';
import { ApiCallStatusPayload } from '../../../shared/models/apiCallsPayload';
import { CLPaymentInformation } from '../../../shared/models/alertData';

@Component({
  selector: 'rtl-cl-lightning-send-payments',
  templateUrl: './send-payment.component.html',
  styleUrls: ['./send-payment.component.scss']
})
export class CLLightningSendPaymentsComponent implements OnInit, OnDestroy {

  @ViewChild('sendPaymentForm', { static: false }) form: NgForm;
  @ViewChild('paymentAmt', { static: false }) paymentAmt: NgModel;
  @ViewChild('offerAmt', { static: false }) offerAmt: NgModel;

  private paymentReq: NgModel;
  @ViewChild('paymentReq') set payReq(paymReq: NgModel) {
    if (paymReq) {
      this.paymentReq = paymReq;
    }
  }
  private offerReq: NgModel;
  @ViewChild('offerReq') set offrReq(ofrReq: NgModel) {
    if (ofrReq) {
      this.offerReq = ofrReq;
    }
  }
  public faExclamationTriangle = faExclamationTriangle;
  public paymentTypes = PaymentTypes;
  public paymentType = PaymentTypes.INVOICE;
  public selNode: SelNodeChild = {};

  public offerDecoded: OfferRequest = {};
  public offerRequest = '';
  public offerDecodedHint = '';
  public offerDescription = '';
  public offerVendor = '';
  public offerTitle = '';
  public zeroAmtOffer = false;
  public offerInvoice: OfferInvoice = null;
  public offerAmount = null;
  public flgSaveToDB = false;
  public hideSaveOption = false;

  public paymentDecoded: PayRequest = {};
  public paymentRequest = '';
  public paymentDecodedHint = '';
  public zeroAmtInvoice = false;
  public paymentAmount = null;

  public pubkey = '';
  public keysendAmount = null;
  public selActiveChannel: Channel = {};
  public activeChannels = {};
  public feeLimit = null;
  public selFeeLimitType = FEE_LIMIT_TYPES[0];
  public feeLimitTypes = FEE_LIMIT_TYPES;
  public paymentError = '';
  public isCompatibleVersion = false;
  private unSubs: Array<Subject<void>> = [new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject(), new Subject()];

  constructor(public dialogRef: MatDialogRef<CLLightningSendPaymentsComponent>, @Inject(MAT_DIALOG_DATA) public data: CLPaymentInformation, private store: Store<RTLState>, private logger: LoggerService, private commonService: CommonService, private decimalPipe: DecimalPipe, private actions: Actions) { }

  ngOnInit() {
    if (this.data && this.data.paymentType) {
      this.paymentType = this.data.paymentType;
      switch (this.paymentType) {
        case PaymentTypes.INVOICE:
          this.paymentRequest = this.data.invoiceBolt11;
          break;
        case PaymentTypes.KEYSEND:
          this.pubkey = this.data.pubkeyKeysend;
          break;
        case PaymentTypes.OFFER:
          this.onPaymentRequestEntry(this.data.offerBolt12);
          this.offerTitle = this.data.offerTitle;
          this.flgSaveToDB = false;
          this.hideSaveOption = true;
          break;
        default:
          break;
      }
    }
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
      filter((action) => action.type === CLActions.UPDATE_API_CALL_STATUS_CL || action.type === CLActions.SEND_PAYMENT_STATUS_CL || action.type === CLActions.SET_DECODED_PAYMENT_CL || action.type === CLActions.SET_OFFER_INVOICE_CL)).
      subscribe((action: any) => {
        if (action.type === CLActions.SEND_PAYMENT_STATUS_CL) {
          this.dialogRef.close();
        }
        if (action.type === CLActions.SET_DECODED_PAYMENT_CL) {
          if (this.paymentType === PaymentTypes.INVOICE) {
            if (action.payload.type === 'bolt12 offer' && action.payload.offer_id) {
              this.paymentDecodedHint = 'ERROR: Select Offer option to pay the bolt12 offer invoice.';
              this.paymentReq.control.setErrors({ decodeError: true });
            } else {
              this.paymentDecoded = action.payload;
              this.setPaymentDecodedDetails();
            }
          } else if (this.paymentType === PaymentTypes.OFFER) {
            if (action.payload.type === 'bolt11 invoice' && action.payload.payment_hash) {
              this.offerDecodedHint = 'ERROR: Select Invoice option to pay the bolt11 invoice.';
              this.offerReq.control.setErrors({ decodeError: true });
            } else {
              this.offerDecoded = action.payload;
              this.setOfferDecodedDetails();
            }
          }
        }
        if (action.type === CLActions.SET_OFFER_INVOICE_CL) {
          this.offerInvoice = action.payload;
          this.sendPayment();
        }
        if (action.type === CLActions.UPDATE_API_CALL_STATUS_CL && action.payload.status === APICallStatusEnum.ERROR) {
          if (action.payload.action === 'SendPayment') {
            delete this.paymentDecoded.msatoshi;
            this.paymentError = action.payload.message;
          }
          if (action.payload.action === 'DecodePayment') {
            if (this.paymentType === PaymentTypes.INVOICE) {
              this.paymentDecodedHint = 'ERROR: ' + action.payload.message;
              this.paymentReq.control.setErrors({ decodeError: true });
            }
            if (this.paymentType === PaymentTypes.OFFER) {
              this.offerDecodedHint = 'ERROR: ' + action.payload.message;
              this.offerReq.control.setErrors({ decodeError: true });
            }
          }
          if (action.payload.action === 'FetchOfferInvoice' && this.paymentType === PaymentTypes.OFFER) {
            this.paymentError = action.payload.message;
          }
        }
      });
  }

  onSendPayment(): boolean | void {
    switch (this.paymentType) {
      case PaymentTypes.KEYSEND:
        if (!this.pubkey || this.pubkey.trim() === '' || !this.keysendAmount || this.keysendAmount <= 0) { return true; }
        this.keysendPayment();
        break;

      case PaymentTypes.INVOICE:
        if (!this.paymentRequest || (this.zeroAmtInvoice && (this.paymentAmount === 0 || !this.paymentAmount))) {
          this.paymentReq.control.markAsTouched();
          this.paymentAmt.control.markAsTouched();
          return true;
        }
        if (this.paymentDecoded.created_at) {
          this.sendPayment();
        } else {
          this.resetInvoiceDetails();
          this.store.dispatch(decodePayment({ payload: { routeParam: this.paymentRequest, fromDialog: true } }));
        }
        break;

      case PaymentTypes.OFFER:
        if (!this.offerRequest || (this.zeroAmtOffer && (this.offerAmount === 0 || !this.offerAmount))) {
          this.offerReq.control.markAsTouched();
          this.offerAmt.control.markAsTouched();
          return true;
        }
        if (this.offerDecoded.offer_id) {
          this.sendPayment();
        } else {
          this.resetOfferDetails();
          this.store.dispatch(decodePayment({ payload: { routeParam: this.offerRequest, fromDialog: true } }));
        }
        break;

      default:
        break;
    }
  }

  keysendPayment() {
    this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_KEYSEND, paymentType: PaymentTypes.KEYSEND, pubkey: this.pubkey, amount: this.keysendAmount * 1000, fromDialog: true } }));
  }

  sendPayment() {
    if (this.paymentType === PaymentTypes.INVOICE) {
      if (this.zeroAmtInvoice) {
        this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentType: PaymentTypes.INVOICE, invoice: this.paymentRequest, amount: this.paymentAmount * 1000, fromDialog: true } }));
      } else {
        this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_PAYMENT, paymentType: PaymentTypes.INVOICE, invoice: this.paymentRequest, fromDialog: true } }));
      }
    } else if (this.paymentType === PaymentTypes.OFFER) {
      if (!this.offerInvoice) {
        if (this.zeroAmtOffer) {
          this.store.dispatch(fetchOfferInvoice({ payload: { offer: this.offerRequest, msatoshi: this.offerAmount * 1000 } }));
        } else {
          this.store.dispatch(fetchOfferInvoice({ payload: { offer: this.offerRequest } }));
        }
      } else {
        this.store.dispatch(sendPayment({ payload: { uiMessage: UI_MESSAGES.SEND_OFFER, paymentType: PaymentTypes.OFFER, invoice: this.offerInvoice.invoice, saveToDB: this.flgSaveToDB, offerBolt12: this.offerRequest, amount: this.offerAmount * 1000, title: this.offerTitle, vendor: this.offerVendor, description: this.offerDescription, fromDialog: true } }));
      }
    }
  }

  onPaymentRequestEntry(event: any) {
    if (this.paymentType === PaymentTypes.INVOICE) {
      this.paymentRequest = event;
      if (this.paymentRequest && this.paymentRequest.length > 100) {
        this.resetInvoiceDetails();
        this.store.dispatch(decodePayment({ payload: { routeParam: this.paymentRequest, fromDialog: true } }));
      }
    } else if (this.paymentType === PaymentTypes.OFFER) {
      this.offerRequest = event;
      if (this.offerRequest && this.offerRequest.length > 100) {
        this.resetOfferDetails();
        this.store.dispatch(decodePayment({ payload: { routeParam: this.offerRequest, fromDialog: true } }));
      }
    }
  }

  resetOfferDetails() {
    this.offerInvoice = null;
    this.offerAmount = null;
    this.offerDecodedHint = '';
    this.zeroAmtOffer = false;
    this.flgSaveToDB = false;
    this.paymentError = '';
    if (this.offerReq) { this.offerReq.control.setErrors(null); }
  }

  resetInvoiceDetails() {
    this.paymentAmount = null;
    this.paymentDecodedHint = '';
    this.zeroAmtInvoice = false;
    this.paymentError = '';
    if (this.paymentReq) { this.paymentReq.control.setErrors(null); }
  }

  onAmountChange(event: any) {
    if (this.paymentType === PaymentTypes.INVOICE) {
      delete this.paymentDecoded.msatoshi;
      this.paymentDecoded.msatoshi = +event.target.value;
    }
    if (this.paymentType === PaymentTypes.OFFER) {
      delete this.offerDecoded.amount;
      delete this.offerDecoded.amount_msat;
      this.offerDecoded.amount = +event.target.value * 1000;
      this.offerDecoded.amount_msat = event.target.value + 'msat';
    }
  }

  onPaymentTypeChange() {
    this.paymentError = '';
    this.paymentDecodedHint = '';
    this.offerDecodedHint = '';
    this.offerInvoice = null;
  }

  setOfferDecodedDetails() {
    if (this.offerDecoded.offer_id && !this.offerDecoded.amount_msat) {
      this.offerDecoded.amount_msat = '0msat';
      this.offerDecoded.amount = 0;
      this.zeroAmtOffer = true;
      this.offerDecodedHint = 'Zero Amount Offer | Description: ' + this.offerDecoded.description;
    } else {
      this.zeroAmtOffer = false;
      this.offerDecoded.amount = +(this.offerDecoded.amount || this.offerDecoded.amount_msat.slice(0, -4));
      this.offerAmount = this.offerDecoded.amount ? this.offerDecoded.amount / 1000 : 0;
      this.offerDescription = this.offerDecoded.description;
      this.offerVendor = this.offerDecoded.vendor ? this.offerDecoded.vendor : this.offerDecoded.issuer ? this.offerDecoded.issuer : '';
      if (this.selNode.fiatConversion) {
        this.commonService.convertCurrency(this.offerAmount, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
          pipe(takeUntil(this.unSubs[5])).
          subscribe({
            next: (data) => {
              this.offerDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.offerAmount) + ' Sats (' + data.symbol + this.decimalPipe.transform((data.OTHER ? data.OTHER : 0), CURRENCY_UNIT_FORMATS.OTHER) + ') | Description: ' + this.offerDecoded.description;
            }, error: (error) => {
              this.offerDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.offerAmount) + ' Sats | Description: ' + this.offerDecoded.description + '. Unable to convert currency.';
            }
          });
      } else {
        this.offerDecodedHint = 'Sending: ' + this.decimalPipe.transform(this.offerAmount) + ' Sats | Description: ' + this.offerDecoded.description;
      }
    }
  }

  setPaymentDecodedDetails() {
    if (this.paymentDecoded.created_at && !this.paymentDecoded.msatoshi) {
      this.paymentDecoded.msatoshi = 0;
      this.zeroAmtInvoice = true;
      this.paymentDecodedHint = 'Zero Amount Invoice | Memo: ' + this.paymentDecoded.description;
    } else {
      this.zeroAmtInvoice = false;
      if (this.selNode.fiatConversion) {
        this.commonService.convertCurrency(this.paymentDecoded.msatoshi ? this.paymentDecoded.msatoshi / 1000 : 0, CurrencyUnitEnum.SATS, CurrencyUnitEnum.OTHER, this.selNode.currencyUnits[2], this.selNode.fiatConversion).
          pipe(takeUntil(this.unSubs[6])).
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
  }

  resetData() {
    switch (this.paymentType) {
      case PaymentTypes.KEYSEND:
        this.pubkey = '';
        this.keysendAmount = null;
        break;

      case PaymentTypes.INVOICE:
        this.paymentRequest = '';
        this.paymentDecoded = {};
        this.selActiveChannel = null;
        this.feeLimit = null;
        this.selFeeLimitType = FEE_LIMIT_TYPES[0];
        this.resetInvoiceDetails();
        break;

      case PaymentTypes.OFFER:
        this.offerRequest = '';
        this.offerDecoded = {};
        this.resetOfferDetails();
        break;
      default:
        break;
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
